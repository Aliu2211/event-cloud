import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
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


def lambda_handler(event, context):
    print(json.dumps({
        "handler": "registration_lookup_by_email",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        query_params = event.get("queryStringParameters") or {}
        email = query_params.get("email")

        if not email:
            return _response(400, {"error": "email query parameter is required"})

        # email-index has no range key requirement here: we want every
        # registration for this email across all events, not just one.
        response = registrations_table.query(
            IndexName="email-index",
            KeyConditionExpression=Key("email").eq(email),
        )
        items = response.get("Items", [])

        return _response(200, {"registrations": items, "count": len(items)})
    except Exception as exc:
        print(json.dumps({"handler": "registration_lookup_by_email", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
