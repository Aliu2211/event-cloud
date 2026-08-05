import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
events_table = dynamodb.Table(os.environ["EVENTS_TABLE"])
sessions_table = dynamodb.Table(os.environ["SESSIONS_TABLE"])

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
}


class _DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def _response(status_code, body):
    return {"statusCode": status_code, "headers": CORS_HEADERS, "body": json.dumps(body, cls=_DecimalEncoder)}


def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def lambda_handler(event, context):
    print(json.dumps({
        "handler": "session_create",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        event_id = event["pathParameters"]["event_id"]
        body = json.loads(event.get("body") or "{}")

        day = body.get("day")
        time = body.get("time")
        title = body.get("title")
        location = body.get("location")

        if not day or not time or not title or not location:
            return _response(400, {"error": "day, time, title, and location are required"})

        event_response = events_table.get_item(Key={"event_id": event_id})
        if not event_response.get("Item"):
            return _response(404, {"error": "Event not found"})

        session_id = f"SES-{uuid.uuid4().hex[:10].upper()}"
        now = _utc_now_iso()

        item = {
            "event_id": event_id,
            "session_id": session_id,
            "day": day,
            "time": time,
            "track": body.get("track", ""),
            "title": title,
            "description": body.get("description", ""),
            "location": location,
            "created_at": now,
            "updated_at": now,
        }

        # speaker_id is a GSI key (speaker-index): DynamoDB rejects empty
        # strings as key values, so omit the attribute entirely rather than
        # defaulting to "" when no speaker is assigned.
        speaker_id = body.get("speaker_id")
        if speaker_id:
            item["speaker_id"] = speaker_id

        sessions_table.put_item(Item=item)

        return _response(201, item)
    except Exception as exc:
        print(json.dumps({"handler": "session_create", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
