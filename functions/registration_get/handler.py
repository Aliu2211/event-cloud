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
        "handler": "registration_get",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        path_value = event["pathParameters"]["registration_id"]

        # This route doubles as the spec's GET /registrations/{email}: the
        # path shape can't distinguish an ID from an email ahead of time
        # (both are a single segment), so branch on whether it looks like
        # one. A registration_id (REG-...) never contains "@".
        if "@" in path_value:
            response = registrations_table.query(
                IndexName="email-index",
                KeyConditionExpression=Key("email").eq(path_value),
            )
            items = response.get("Items", [])
            return _response(200, {"registrations": items, "count": len(items)})

        # registration_id is only a sort key on the base table, so a lookup
        # by ID alone goes through the registration-id-index GSI instead.
        response = registrations_table.query(
            IndexName="registration-id-index",
            KeyConditionExpression=Key("registration_id").eq(path_value),
        )
        items = response.get("Items", [])

        if not items:
            return _response(404, {"error": "Registration not found"})

        return _response(200, items[0])
    except Exception as exc:
        print(json.dumps({"handler": "registration_get", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
