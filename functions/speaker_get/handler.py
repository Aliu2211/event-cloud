import json
import os
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


def lambda_handler(event, context):
    print(json.dumps({
        "handler": "speaker_get",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        speaker_id = event["pathParameters"]["speaker_id"]

        response = speakers_table.get_item(Key={"speaker_id": speaker_id})
        item = response.get("Item")

        if not item:
            return _response(404, {"error": "Speaker not found"})

        return _response(200, item)
    except Exception as exc:
        print(json.dumps({"handler": "speaker_get", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
