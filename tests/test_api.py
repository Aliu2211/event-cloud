import importlib.util
import json
import os
import sys
from pathlib import Path

import boto3
import pytest
from moto import mock_aws

ROOT = Path(__file__).resolve().parent.parent

os.environ.setdefault("AWS_ACCESS_KEY_ID", "testing")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "testing")
os.environ.setdefault("AWS_SECURITY_TOKEN", "testing")
os.environ.setdefault("AWS_SESSION_TOKEN", "testing")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

ENVIRONMENT = "test"
EVENTS_TABLE = f"events-{ENVIRONMENT}"
REGISTRATIONS_TABLE = f"registrations-{ENVIRONMENT}"
SESSIONS_TABLE = f"sessions-{ENVIRONMENT}"
SPEAKERS_TABLE = f"speakers-{ENVIRONMENT}"
SNS_TOPIC_NAME = f"event-registrations-{ENVIRONMENT}"
IMAGES_BUCKET = f"event-ticketing-images-{ENVIRONMENT}"

os.environ["EVENTS_TABLE"] = EVENTS_TABLE
os.environ["REGISTRATIONS_TABLE"] = REGISTRATIONS_TABLE
os.environ["SESSIONS_TABLE"] = SESSIONS_TABLE
os.environ["SPEAKERS_TABLE"] = SPEAKERS_TABLE
os.environ["ENVIRONMENT"] = ENVIRONMENT
os.environ["IMAGES_BUCKET"] = IMAGES_BUCKET
os.environ["IMAGES_BUCKET_URL"] = f"https://{IMAGES_BUCKET}.s3.us-east-1.amazonaws.com"


def _load_handler(function_name):
    """Load functions/{function_name}/handler.py under a unique module name.

    Every function's handler.py is a separate top-level module named
    "handler", so a plain import would collide across functions. Loading
    each one from its file path with a distinct module name avoids that.
    """
    module_name = f"{function_name}_handler_module"
    path = ROOT / "functions" / function_name / "handler.py"
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="session")
def aws_mock():
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
        dynamodb.create_table(
            TableName=EVENTS_TABLE,
            KeySchema=[{"AttributeName": "event_id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "event_id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        dynamodb.create_table(
            TableName=REGISTRATIONS_TABLE,
            KeySchema=[
                {"AttributeName": "event_id", "KeyType": "HASH"},
                {"AttributeName": "registration_id", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "event_id", "AttributeType": "S"},
                {"AttributeName": "registration_id", "AttributeType": "S"},
                {"AttributeName": "email", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "email-index",
                    "KeySchema": [
                        {"AttributeName": "email", "KeyType": "HASH"},
                        {"AttributeName": "event_id", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "registration-id-index",
                    "KeySchema": [{"AttributeName": "registration_id", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        dynamodb.create_table(
            TableName=SESSIONS_TABLE,
            KeySchema=[
                {"AttributeName": "event_id", "KeyType": "HASH"},
                {"AttributeName": "session_id", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "event_id", "AttributeType": "S"},
                {"AttributeName": "session_id", "AttributeType": "S"},
                {"AttributeName": "speaker_id", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "speaker-index",
                    "KeySchema": [{"AttributeName": "speaker_id", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        dynamodb.create_table(
            TableName=SPEAKERS_TABLE,
            KeySchema=[{"AttributeName": "speaker_id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "speaker_id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )

        sns = boto3.client("sns", region_name="us-east-1")
        topic = sns.create_topic(Name=SNS_TOPIC_NAME)
        os.environ["SNS_TOPIC_ARN"] = topic["TopicArn"]

        s3 = boto3.client("s3", region_name="us-east-1")
        s3.create_bucket(Bucket=IMAGES_BUCKET)

        yield {
            "events_table": dynamodb.Table(EVENTS_TABLE),
            "registrations_table": dynamodb.Table(REGISTRATIONS_TABLE),
            "sessions_table": dynamodb.Table(SESSIONS_TABLE),
            "speakers_table": dynamodb.Table(SPEAKERS_TABLE),
        }


@pytest.fixture(scope="session")
def handlers(aws_mock):
    return {
        "event_create": _load_handler("event_create"),
        "event_get": _load_handler("event_get"),
        "event_list": _load_handler("event_list"),
        "registration_create": _load_handler("registration_create"),
        "registration_get": _load_handler("registration_get"),
        "registration_delete": _load_handler("registration_delete"),
        "registration_list": _load_handler("registration_list"),
        "registration_list_all": _load_handler("registration_list_all"),
        "registration_lookup_by_email": _load_handler("registration_lookup_by_email"),
        "session_create": _load_handler("session_create"),
        "session_list": _load_handler("session_list"),
        "speaker_create": _load_handler("speaker_create"),
        "speaker_list": _load_handler("speaker_list"),
        "speaker_get": _load_handler("speaker_get"),
        "session_list_by_speaker": _load_handler("session_list_by_speaker"),
        "image_upload_url": _load_handler("image_upload_url"),
    }


@pytest.fixture(autouse=True)
def clean_tables(aws_mock):
    yield
    for item in aws_mock["events_table"].scan().get("Items", []):
        aws_mock["events_table"].delete_item(Key={"event_id": item["event_id"]})
    for item in aws_mock["registrations_table"].scan().get("Items", []):
        aws_mock["registrations_table"].delete_item(
            Key={"event_id": item["event_id"], "registration_id": item["registration_id"]}
        )
    for item in aws_mock["sessions_table"].scan().get("Items", []):
        aws_mock["sessions_table"].delete_item(
            Key={"event_id": item["event_id"], "session_id": item["session_id"]}
        )
    for item in aws_mock["speakers_table"].scan().get("Items", []):
        aws_mock["speakers_table"].delete_item(Key={"speaker_id": item["speaker_id"]})


def _invoke(handler_module, path_parameters=None, body=None, query_string_parameters=None):
    event = {
        "httpMethod": "POST",
        "path": "/",
        "pathParameters": path_parameters,
        "queryStringParameters": query_string_parameters,
        "body": json.dumps(body) if body is not None else None,
    }
    context = type("Context", (), {"aws_request_id": "test-request-id"})()
    response = handler_module.lambda_handler(event, context)
    response["json"] = json.loads(response["body"])
    return response


def _create_event(handlers_, **overrides):
    payload = {
        "event_name": "Test Conference",
        "date": "2026-09-01",
        "location": "Remote",
        "capacity": 10,
    }
    payload.update(overrides)
    response = _invoke(handlers_["event_create"], body=payload)
    return response["json"]


class TestEvents:
    def test_create_event_success(self, handlers):
        response = _invoke(
            handlers["event_create"],
            body={"event_name": "Cloud Summit", "date": "2026-09-14", "location": "Las Vegas", "capacity": 100},
        )
        assert response["statusCode"] == 201
        assert response["json"]["event_id"].startswith("EVT-")
        assert response["json"]["status"] == "available"
        assert response["json"]["registered_count"] == 0

    def test_create_event_missing_name(self, handlers):
        response = _invoke(
            handlers["event_create"],
            body={"date": "2026-09-14", "location": "Las Vegas", "capacity": 100},
        )
        assert response["statusCode"] == 400

    def test_create_event_missing_capacity(self, handlers):
        response = _invoke(
            handlers["event_create"],
            body={"event_name": "Cloud Summit", "date": "2026-09-14", "location": "Las Vegas"},
        )
        assert response["statusCode"] == 400

    def test_get_event_success(self, handlers):
        created = _create_event(handlers)
        response = _invoke(handlers["event_get"], path_parameters={"event_id": created["event_id"]})
        assert response["statusCode"] == 200
        assert response["json"]["event_id"] == created["event_id"]

    def test_get_event_not_found(self, handlers):
        response = _invoke(handlers["event_get"], path_parameters={"event_id": "EVT-DOESNOTEXIST"})
        assert response["statusCode"] == 404

    def test_list_events_empty(self, handlers):
        response = _invoke(handlers["event_list"])
        assert response["statusCode"] == 200
        assert response["json"] == {"events": [], "count": 0}

    def test_create_event_with_image_url(self, handlers):
        response = _invoke(
            handlers["event_create"],
            body={
                "event_name": "Cloud Summit",
                "date": "2026-09-14",
                "location": "Las Vegas",
                "capacity": 100,
                "image_url": "https://event-ticketing-images-test.s3.us-east-1.amazonaws.com/events/abc123.jpg",
            },
        )
        assert response["statusCode"] == 201
        assert response["json"]["image_url"].endswith("abc123.jpg")

    def test_create_event_without_image_url_omits_field(self, handlers):
        response = _invoke(
            handlers["event_create"],
            body={"event_name": "Cloud Summit", "date": "2026-09-14", "location": "Las Vegas", "capacity": 100},
        )
        assert response["statusCode"] == 201
        assert "image_url" not in response["json"]

    def test_list_events_by_status(self, handlers):
        available_event = _create_event(handlers, event_name="Available Event", capacity=10)
        full_event = _create_event(handlers, event_name="Full Event", capacity=1)
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": full_event["event_id"]},
            body={"participant_name": "Attendee One", "email": "attendee1@example.com"},
        )

        response = _invoke(handlers["event_list"], query_string_parameters={"status": "available"})
        assert response["statusCode"] == 200
        event_ids = [event["event_id"] for event in response["json"]["events"]]
        assert available_event["event_id"] in event_ids
        assert full_event["event_id"] not in event_ids


class TestRegistrations:
    def test_register_success(self, handlers):
        event = _create_event(handlers)
        response = _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "Jane Doe", "email": "jane@example.com"},
        )
        assert response["statusCode"] == 201
        assert response["json"]["ticket_number"].startswith("TKT-")
        assert response["json"]["status"] == "confirmed"

    def test_register_flat_alias_event_id_in_body(self, handlers):
        # POST /register (no {event_id} path segment) must fall back to
        # event_id in the body, same handler as the nested route.
        event = _create_event(handlers)
        response = _invoke(
            handlers["registration_create"],
            body={"event_id": event["event_id"], "participant_name": "Jane Doe", "email": "jane@example.com"},
        )
        assert response["statusCode"] == 201
        assert response["json"]["status"] == "confirmed"

    def test_register_flat_alias_missing_event_id(self, handlers):
        response = _invoke(
            handlers["registration_create"],
            body={"participant_name": "Jane Doe", "email": "jane@example.com"},
        )
        assert response["statusCode"] == 400

    def test_register_missing_email(self, handlers):
        event = _create_event(handlers)
        response = _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "Jane Doe"},
        )
        assert response["statusCode"] == 400

    def test_register_event_not_found(self, handlers):
        response = _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": "EVT-DOESNOTEXIST"},
            body={"participant_name": "Jane Doe", "email": "jane@example.com"},
        )
        assert response["statusCode"] == 404

    def test_register_full_event(self, handlers):
        event = _create_event(handlers, capacity=1)
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "First Attendee", "email": "first@example.com"},
        )
        response = _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "Second Attendee", "email": "second@example.com"},
        )
        assert response["statusCode"] == 400

    def test_register_duplicate(self, handlers):
        event = _create_event(handlers)
        payload = {"participant_name": "Jane Doe", "email": "jane@example.com"}
        _invoke(handlers["registration_create"], path_parameters={"event_id": event["event_id"]}, body=payload)
        response = _invoke(
            handlers["registration_create"], path_parameters={"event_id": event["event_id"]}, body=payload
        )
        assert response["statusCode"] == 409

    def test_list_registrations(self, handlers):
        event = _create_event(handlers, capacity=10)
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "Jane Doe", "email": "jane@example.com"},
        )
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "John Smith", "email": "john@example.com"},
        )
        response = _invoke(handlers["registration_list"], path_parameters={"event_id": event["event_id"]})
        assert response["statusCode"] == 200
        assert response["json"]["count"] == 2


class TestRegistrationCancellation:
    def test_cancel_success(self, handlers):
        event = _create_event(handlers, capacity=10)
        registration = _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "Jane Doe", "email": "jane@example.com"},
        )["json"]

        response = _invoke(
            handlers["registration_delete"],
            path_parameters={"registration_id": registration["registration_id"]},
        )
        assert response["statusCode"] == 200
        assert response["json"]["status"] == "cancelled"

        # Soft cancel: the record stays around with status flipped, not deleted.
        get_response = _invoke(
            handlers["registration_get"], path_parameters={"registration_id": registration["registration_id"]}
        )
        assert get_response["statusCode"] == 200
        assert get_response["json"]["status"] == "cancelled"

        event_after = _invoke(handlers["event_get"], path_parameters={"event_id": event["event_id"]})["json"]
        assert event_after["registered_count"] == 0

    def test_cancel_frees_up_a_full_event(self, handlers):
        event = _create_event(handlers, capacity=1)
        registration = _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "Jane Doe", "email": "jane@example.com"},
        )["json"]
        assert _invoke(handlers["event_get"], path_parameters={"event_id": event["event_id"]})["json"][
            "status"
        ] == "full"

        _invoke(handlers["registration_delete"], path_parameters={"registration_id": registration["registration_id"]})

        event_after = _invoke(handlers["event_get"], path_parameters={"event_id": event["event_id"]})["json"]
        assert event_after["status"] == "available"

    def test_cancel_not_found(self, handlers):
        response = _invoke(handlers["registration_delete"], path_parameters={"registration_id": "REG-DOESNOTEXIST"})
        assert response["statusCode"] == 404

    def test_cancel_already_cancelled(self, handlers):
        event = _create_event(handlers)
        registration = _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "Jane Doe", "email": "jane@example.com"},
        )["json"]
        _invoke(handlers["registration_delete"], path_parameters={"registration_id": registration["registration_id"]})

        response = _invoke(
            handlers["registration_delete"], path_parameters={"registration_id": registration["registration_id"]}
        )
        assert response["statusCode"] == 400


class TestRegistrationGetEmailAlias:
    def test_path_value_with_at_sign_returns_email_lookup_shape(self, handlers):
        # Literal spec alias: GET /registrations/{email} shares the same
        # resource as GET /registrations/{registration_id}; registration_get
        # branches on whether the path segment looks like an email.
        first_event = _create_event(handlers, event_name="First Event")
        second_event = _create_event(handlers, event_name="Second Event")
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": first_event["event_id"]},
            body={"participant_name": "Shared Attendee", "email": "shared@example.com"},
        )
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": second_event["event_id"]},
            body={"participant_name": "Shared Attendee", "email": "shared@example.com"},
        )

        response = _invoke(handlers["registration_get"], path_parameters={"registration_id": "shared@example.com"})
        assert response["statusCode"] == 200
        assert response["json"]["count"] == 2

    def test_path_value_without_at_sign_returns_single_registration(self, handlers):
        event = _create_event(handlers)
        registration = _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"participant_name": "Jane Doe", "email": "jane@example.com"},
        )["json"]

        response = _invoke(
            handlers["registration_get"], path_parameters={"registration_id": registration["registration_id"]}
        )
        assert response["statusCode"] == 200
        assert response["json"]["registration_id"] == registration["registration_id"]


class TestCrossEventRegistrations:
    def test_list_all_registrations(self, handlers):
        first_event = _create_event(handlers, event_name="First Event")
        second_event = _create_event(handlers, event_name="Second Event")
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": first_event["event_id"]},
            body={"participant_name": "Attendee One", "email": "one@example.com"},
        )
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": second_event["event_id"]},
            body={"participant_name": "Attendee Two", "email": "two@example.com"},
        )

        response = _invoke(handlers["registration_list_all"])
        assert response["statusCode"] == 200
        event_ids = {registration["event_id"] for registration in response["json"]["registrations"]}
        assert first_event["event_id"] in event_ids
        assert second_event["event_id"] in event_ids
        assert response["json"]["count"] == 2

    def test_lookup_by_email_missing_param(self, handlers):
        response = _invoke(handlers["registration_lookup_by_email"])
        assert response["statusCode"] == 400

    def test_lookup_by_email_success(self, handlers):
        first_event = _create_event(handlers, event_name="First Event")
        second_event = _create_event(handlers, event_name="Second Event")
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": first_event["event_id"]},
            body={"participant_name": "Shared Attendee", "email": "shared@example.com"},
        )
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": second_event["event_id"]},
            body={"participant_name": "Shared Attendee", "email": "shared@example.com"},
        )
        _invoke(
            handlers["registration_create"],
            path_parameters={"event_id": first_event["event_id"]},
            body={"participant_name": "Someone Else", "email": "someone.else@example.com"},
        )

        response = _invoke(
            handlers["registration_lookup_by_email"], query_string_parameters={"email": "shared@example.com"}
        )
        assert response["statusCode"] == 200
        assert response["json"]["count"] == 2
        emails = {registration["email"] for registration in response["json"]["registrations"]}
        assert emails == {"shared@example.com"}


class TestSessions:
    def test_create_session_success(self, handlers):
        event = _create_event(handlers)
        response = _invoke(
            handlers["session_create"],
            path_parameters={"event_id": event["event_id"]},
            body={
                "day": "Day 1",
                "time": "09:00 AM",
                "title": "Opening Keynote",
                "location": "Main Hall",
                "track": "Technical",
            },
        )
        assert response["statusCode"] == 201
        assert response["json"]["session_id"].startswith("SES-")
        assert response["json"]["event_id"] == event["event_id"]

    def test_create_session_missing_fields(self, handlers):
        event = _create_event(handlers)
        response = _invoke(
            handlers["session_create"],
            path_parameters={"event_id": event["event_id"]},
            body={"day": "Day 1", "time": "09:00 AM"},
        )
        assert response["statusCode"] == 400

    def test_create_session_event_not_found(self, handlers):
        response = _invoke(
            handlers["session_create"],
            path_parameters={"event_id": "EVT-DOESNOTEXIST"},
            body={"day": "Day 1", "time": "09:00 AM", "title": "Keynote", "location": "Main Hall"},
        )
        assert response["statusCode"] == 404

    def test_list_sessions(self, handlers):
        first_event = _create_event(handlers, event_name="First Event")
        second_event = _create_event(handlers, event_name="Second Event")
        for title in ["Session A", "Session B"]:
            _invoke(
                handlers["session_create"],
                path_parameters={"event_id": first_event["event_id"]},
                body={"day": "Day 1", "time": "09:00 AM", "title": title, "location": "Main Hall"},
            )
        _invoke(
            handlers["session_create"],
            path_parameters={"event_id": second_event["event_id"]},
            body={"day": "Day 1", "time": "09:00 AM", "title": "Other Event Session", "location": "Room B"},
        )

        response = _invoke(handlers["session_list"], path_parameters={"event_id": first_event["event_id"]})
        assert response["statusCode"] == 200
        assert response["json"]["count"] == 2


class TestSpeakers:
    def test_create_speaker_success(self, handlers):
        response = _invoke(
            handlers["speaker_create"],
            body={
                "name": "Sarah Chen",
                "role": "CTO at CloudDynamics",
                "bio": "A visionary technology leader.",
                "expertise": ["Cloud Infrastructure", "Serverless"],
                "years_experience": 15,
                "talks_delivered": 42,
            },
        )
        assert response["statusCode"] == 201
        assert response["json"]["speaker_id"].startswith("SPK-")
        assert response["json"]["years_experience"] == 15

    def test_create_speaker_missing_fields(self, handlers):
        response = _invoke(handlers["speaker_create"], body={"name": "Sarah Chen"})
        assert response["statusCode"] == 400

    def test_list_speakers(self, handlers):
        _invoke(handlers["speaker_create"], body={"name": "Speaker One", "role": "Role One"})
        _invoke(handlers["speaker_create"], body={"name": "Speaker Two", "role": "Role Two"})

        response = _invoke(handlers["speaker_list"])
        assert response["statusCode"] == 200
        assert response["json"]["count"] == 2

    def test_get_speaker_success(self, handlers):
        created = _invoke(handlers["speaker_create"], body={"name": "Sarah Chen", "role": "CTO"})["json"]
        response = _invoke(handlers["speaker_get"], path_parameters={"speaker_id": created["speaker_id"]})
        assert response["statusCode"] == 200
        assert response["json"]["speaker_id"] == created["speaker_id"]

    def test_get_speaker_not_found(self, handlers):
        response = _invoke(handlers["speaker_get"], path_parameters={"speaker_id": "SPK-DOESNOTEXIST"})
        assert response["statusCode"] == 404

    def test_list_sessions_by_speaker_across_events(self, handlers):
        speaker = _invoke(handlers["speaker_create"], body={"name": "Sarah Chen", "role": "CTO"})["json"]
        first_event = _create_event(handlers, event_name="First Event")
        second_event = _create_event(handlers, event_name="Second Event")
        _invoke(
            handlers["session_create"],
            path_parameters={"event_id": first_event["event_id"]},
            body={
                "day": "Day 1",
                "time": "09:00 AM",
                "title": "Keynote",
                "location": "Main Hall",
                "speaker_id": speaker["speaker_id"],
            },
        )
        _invoke(
            handlers["session_create"],
            path_parameters={"event_id": second_event["event_id"]},
            body={
                "day": "Day 1",
                "time": "10:00 AM",
                "title": "Workshop",
                "location": "Room B",
                "speaker_id": speaker["speaker_id"],
            },
        )
        _invoke(
            handlers["session_create"],
            path_parameters={"event_id": first_event["event_id"]},
            body={"day": "Day 1", "time": "11:00 AM", "title": "Unrelated Session", "location": "Room C"},
        )

        response = _invoke(
            handlers["session_list_by_speaker"], path_parameters={"speaker_id": speaker["speaker_id"]}
        )
        assert response["statusCode"] == 200
        assert response["json"]["count"] == 2
        event_ids = {session["event_id"] for session in response["json"]["sessions"]}
        assert event_ids == {first_event["event_id"], second_event["event_id"]}


class TestImageUpload:
    def test_generates_presigned_url_for_jpeg(self, handlers):
        response = _invoke(handlers["image_upload_url"], body={"content_type": "image/jpeg"})
        assert response["statusCode"] == 200
        assert response["json"]["upload_url"].startswith("https://")
        assert response["json"]["image_url"].startswith(f"https://{IMAGES_BUCKET}")
        assert response["json"]["image_url"].endswith(".jpg")

    def test_rejects_unsupported_content_type(self, handlers):
        response = _invoke(handlers["image_upload_url"], body={"content_type": "application/pdf"})
        assert response["statusCode"] == 400

    def test_rejects_missing_content_type(self, handlers):
        response = _invoke(handlers["image_upload_url"], body={})
        assert response["statusCode"] == 400
