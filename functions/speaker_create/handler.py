import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
speakers_table = dynamodb.Table(os.environ["SPEAKERS_TABLE"])

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
        "handler": "speaker_create",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        body = json.loads(event.get("body") or "{}")

        name = body.get("name")
        role = body.get("role")

        if not name or not role:
            return _response(400, {"error": "name and role are required"})

        try:
            years_experience = int(body.get("years_experience", 0))
            talks_delivered = int(body.get("talks_delivered", 0))
        except (TypeError, ValueError):
            return _response(400, {"error": "years_experience and talks_delivered must be integers"})

        speaker_id = f"SPK-{uuid.uuid4().hex[:10].upper()}"
        now = _utc_now_iso()

        item = {
            "speaker_id": speaker_id,
            "name": name,
            "role": role,
            "bio": body.get("bio", ""),
            "expertise": body.get("expertise", []),
            "years_experience": years_experience,
            "talks_delivered": talks_delivered,
            "created_at": now,
            "updated_at": now,
        }

        speakers_table.put_item(Item=item)

        return _response(201, item)
    except Exception as exc:
        print(json.dumps({"handler": "speaker_create", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
