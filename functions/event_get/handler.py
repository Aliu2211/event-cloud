import json
import os
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


def lambda_handler(event, context):
    print(json.dumps({
        "handler": "event_get",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        event_id = event["pathParameters"]["event_id"]

        response = events_table.get_item(Key={"event_id": event_id})
        item = response.get("Item")

        if not item:
            return _response(404, {"error": "Event not found"})

        return _response(200, item)
    except Exception as exc:
        print(json.dumps({"handler": "event_get", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
