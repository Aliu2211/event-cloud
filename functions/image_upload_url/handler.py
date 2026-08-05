import json
import os
import uuid

import boto3
from botocore.config import Config

s3 = boto3.client("s3", config=Config(signature_version="s3v4"))
BUCKET = os.environ["IMAGES_BUCKET"]
BUCKET_URL = os.environ["IMAGES_BUCKET_URL"]

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
}

# Presigned PUT enforces this exact Content-Type, so only these three are
# accepted; the extension in the generated key comes straight from here.
ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


def _response(status_code, body):
    return {"statusCode": status_code, "headers": CORS_HEADERS, "body": json.dumps(body)}


def lambda_handler(event, context):
    print(json.dumps({
        "handler": "image_upload_url",
        "http_method": event.get("httpMethod"),
        "path": event.get("path"),
        "request_id": getattr(context, "aws_request_id", None),
    }))
    try:
        body = json.loads(event.get("body") or "{}")
        content_type = body.get("content_type")

        ext = ALLOWED_CONTENT_TYPES.get(content_type)
        if not ext:
            return _response(400, {"error": "content_type must be one of image/jpeg, image/png, image/webp"})

        key = f"events/{uuid.uuid4().hex}.{ext}"
        upload_url = s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": BUCKET, "Key": key, "ContentType": content_type},
            ExpiresIn=300,
        )

        return _response(200, {"upload_url": upload_url, "image_url": f"{BUCKET_URL}/{key}"})
    except Exception as exc:
        print(json.dumps({"handler": "image_upload_url", "error": str(exc)}))
        return _response(500, {"error": "Internal server error"})
