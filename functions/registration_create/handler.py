import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
events_table = dynamodb.Table(os.environ["EVENTS_TABLE"])
registrations_table = dynamodb.Table(os.environ["REGISTRATIONS_TABLE"])
sns = boto3.client("sns")
SNS_TOPIC_ARN = os.environ["SNS_TOPIC_ARN"]

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
        "handler": "registration_create",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        body = json.loads(event.get("body") or "{}")

        # POST /events/{event_id}/register carries event_id in the path;
        # the flat POST /register alias has no path parameter at all, so
        # it must be supplied in the body instead.
        path_params = event.get("pathParameters") or {}
        event_id = path_params.get("event_id") or body.get("event_id")

        participant_name = body.get("participant_name")
        email = body.get("email")
        phone = body.get("phone")

        if not event_id:
            return _response(400, {"error": "event_id is required"})
        if not participant_name or not email:
            return _response(400, {"error": "participant_name and email are required"})

        event_response = events_table.get_item(Key={"event_id": event_id})
        event_item = event_response.get("Item")

        if not event_item:
            return _response(404, {"error": "Event not found"})

        if event_item["status"] in ("full", "cancelled"):
            return _response(400, {"error": "Event is not available for registration"})

        existing = registrations_table.query(
            IndexName="email-index",
            KeyConditionExpression=Key("email").eq(email) & Key("event_id").eq(event_id),
        )
        if existing.get("Items"):
            return _response(409, {"error": "You are already registered for this event"})

        registration_id = f"REG-{uuid.uuid4().hex[:10].upper()}"
        ticket_number = f"TKT-{event_id[:6]}-{uuid.uuid4().hex[:6].upper()}"
        registered_at = _utc_now_iso()

        registration_item = {
            "event_id": event_id,
            "registration_id": registration_id,
            "participant_name": participant_name,
            "email": email,
            "registered_at": registered_at,
            "ticket_number": ticket_number,
            "status": "confirmed",
        }
        if phone:
            registration_item["phone"] = phone

        registrations_table.put_item(Item=registration_item)

        new_count = int(event_item["registered_count"]) + 1
        capacity = int(event_item["capacity"])

        if new_count >= capacity:
            new_status = "full"
        elif new_count >= capacity * 0.8:
            new_status = "limited"
        else:
            new_status = event_item["status"]

        events_table.update_item(
            Key={"event_id": event_id},
            UpdateExpression="ADD registered_count :inc SET #status = :status, updated_at = :updated_at",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={
                ":inc": 1,
                ":status": new_status,
                ":updated_at": _utc_now_iso(),
            },
        )

        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=(
                f"Registration confirmed! Ticket: {ticket_number} for "
                f"{event_item['event_name']} on {event_item['date']}. See you there!"
            ),
        )

        return _response(201, {
            "registration_id": registration_id,
            "ticket_number": ticket_number,
            "event_name": event_item["event_name"],
            "date": event_item["date"],
            "participant_name": participant_name,
            "email": email,
            "status": "confirmed",
        })
    except Exception as exc:
        print(json.dumps({"handler": "registration_create", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
