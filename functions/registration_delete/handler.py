import json
import os
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
events_table = dynamodb.Table(os.environ["EVENTS_TABLE"])
registrations_table = dynamodb.Table(os.environ["REGISTRATIONS_TABLE"])

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
        "handler": "registration_delete",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        registration_id = event["pathParameters"]["registration_id"]

        # registration_id is only a sort key on the base table, same lookup
        # pattern as registration_get.
        lookup = registrations_table.query(
            IndexName="registration-id-index",
            KeyConditionExpression=Key("registration_id").eq(registration_id),
        )
        items = lookup.get("Items", [])
        if not items:
            return _response(404, {"error": "Registration not found"})

        registration = items[0]
        if registration["status"] == "cancelled":
            return _response(400, {"error": "Registration is already cancelled"})

        event_id = registration["event_id"]
        now = _utc_now_iso()

        # Soft cancel: keep the record (and its ticket number) around instead
        # of deleting it, so it stays visible as history in registration
        # lookups rather than silently vanishing.
        registrations_table.update_item(
            Key={"event_id": event_id, "registration_id": registration_id},
            UpdateExpression="SET #status = :status, cancelled_at = :cancelled_at",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":status": "cancelled", ":cancelled_at": now},
        )

        event_response = events_table.get_item(Key={"event_id": event_id})
        event_item = event_response.get("Item")
        if event_item:
            new_count = max(int(event_item["registered_count"]) - 1, 0)
            capacity = int(event_item["capacity"])

            if event_item["status"] != "cancelled":
                if new_count >= capacity:
                    new_status = "full"
                elif new_count >= capacity * 0.8:
                    new_status = "limited"
                else:
                    new_status = "available"
            else:
                new_status = "cancelled"

            events_table.update_item(
                Key={"event_id": event_id},
                UpdateExpression="SET registered_count = :count, #status = :status, updated_at = :updated_at",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":count": new_count,
                    ":status": new_status,
                    ":updated_at": now,
                },
            )

        return _response(200, {"registration_id": registration_id, "status": "cancelled"})
    except Exception as exc:
        print(json.dumps({"handler": "registration_delete", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
