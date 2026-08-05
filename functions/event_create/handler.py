import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
events_table = dynamodb.Table(os.environ["EVENTS_TABLE"])

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
        "handler": "event_create",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        body = json.loads(event.get("body") or "{}")

        event_name = body.get("event_name")
        date = body.get("date")
        location = body.get("location")
        capacity = body.get("capacity")

        if not event_name or not date or not location or capacity is None:
            return _response(400, {"error": "event_name, date, location, and capacity are required"})

        try:
            capacity_value = int(capacity)
        except (TypeError, ValueError):
            return _response(400, {"error": "capacity must be an integer"})

        event_id = f"EVT-{uuid.uuid4().hex[:10].upper()}"
        now = _utc_now_iso()

        item = {
            "event_id": event_id,
            "event_name": event_name,
            "description": body.get("description", ""),
            "date": date,
            "location": location,
            "capacity": capacity_value,
            "registered_count": 0,
            "status": "available",
            "created_at": now,
            "updated_at": now,
        }

        image_url = body.get("image_url")
        if image_url:
            item["image_url"] = image_url

        events_table.put_item(Item=item)

        return _response(201, item)
    except Exception as exc:
        print(json.dumps({"handler": "event_create", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
