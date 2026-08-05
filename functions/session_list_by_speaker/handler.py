import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
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


def lambda_handler(event, context):
    print(json.dumps({
        "handler": "session_list_by_speaker",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        speaker_id = event["pathParameters"]["speaker_id"]

        response = sessions_table.query(
            IndexName="speaker-index",
            KeyConditionExpression=Key("speaker_id").eq(speaker_id),
        )
        items = response.get("Items", [])

        return _response(200, {"sessions": items, "count": len(items)})
    except Exception as exc:
        print(json.dumps({"handler": "session_list_by_speaker", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
