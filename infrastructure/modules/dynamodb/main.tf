resource "aws_dynamodb_table" "events" {
  name         = "events-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"

  attribute {
    name = "event_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "sessions" {
  name         = "sessions-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"
  range_key    = "session_id"

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "session_id"
    type = "S"
  }

  attribute {
    name = "speaker_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  # Looks up all sessions for a speaker across every event, since the base
  # table is partitioned by event_id, not speaker_id.
  global_secondary_index {
    name            = "speaker-index"
    hash_key        = "speaker_id"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "speakers" {
  name         = "speakers-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "speaker_id"

  attribute {
    name = "speaker_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "registrations" {
  name         = "registrations-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"
  range_key    = "registration_id"

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "registration_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  # Looks up all registrations for a participant by email (also used by
  # registration_create to detect duplicate registrations for an event).
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    range_key       = "event_id"
    projection_type = "ALL"
  }

  # registration_id is a sort key, not the table's partition key, so
  # registration_get needs this GSI to look a registration up by ID alone.
  global_secondary_index {
    name            = "registration-id-index"
    hash_key        = "registration_id"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
