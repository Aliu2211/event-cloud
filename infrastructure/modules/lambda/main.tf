locals {
  function_names = [
    "event_create",
    "event_get",
    "event_list",
    "registration_create",
    "registration_get",
    "registration_delete",
    "registration_list",
    "registration_list_all",
    "registration_lookup_by_email",
    "session_create",
    "session_list",
    "speaker_create",
    "speaker_list",
    "speaker_get",
    "session_list_by_speaker",
    "image_upload_url",
  ]

  # Least-privilege DynamoDB access per function: only the table/index and
  # actions that handler actually calls, not blanket CRUD on every table.
  function_table_access = {
    event_create = {
      (var.events_table_arn) = ["dynamodb:PutItem"]
    }
    event_get = {
      (var.events_table_arn) = ["dynamodb:GetItem"]
    }
    event_list = {
      (var.events_table_arn) = ["dynamodb:Scan"]
    }
    registration_create = {
      (var.events_table_arn)                   = ["dynamodb:GetItem", "dynamodb:UpdateItem"]
      (var.registrations_table_arn)            = ["dynamodb:PutItem"]
      "${var.registrations_table_arn}/index/*" = ["dynamodb:Query"]
    }
    registration_get = {
      "${var.registrations_table_arn}/index/*" = ["dynamodb:Query"]
    }
    registration_delete = {
      (var.events_table_arn)                   = ["dynamodb:GetItem", "dynamodb:UpdateItem"]
      (var.registrations_table_arn)            = ["dynamodb:UpdateItem"]
      "${var.registrations_table_arn}/index/*" = ["dynamodb:Query"]
    }
    registration_list = {
      (var.registrations_table_arn) = ["dynamodb:Query"]
    }
    registration_list_all = {
      (var.registrations_table_arn) = ["dynamodb:Scan"]
    }
    registration_lookup_by_email = {
      "${var.registrations_table_arn}/index/*" = ["dynamodb:Query"]
    }
    session_create = {
      (var.events_table_arn)   = ["dynamodb:GetItem"]
      (var.sessions_table_arn) = ["dynamodb:PutItem"]
    }
    session_list = {
      (var.sessions_table_arn) = ["dynamodb:Query"]
    }
    session_list_by_speaker = {
      "${var.sessions_table_arn}/index/*" = ["dynamodb:Query"]
    }
    speaker_create = {
      (var.speakers_table_arn) = ["dynamodb:PutItem"]
    }
    speaker_list = {
      (var.speakers_table_arn) = ["dynamodb:Scan"]
    }
    speaker_get = {
      (var.speakers_table_arn) = ["dynamodb:GetItem"]
    }
    image_upload_url = {}
  }

  # Only registration_create sends a confirmation notification.
  function_sns = {
    registration_create = true
  }

  # Only image_upload_url ever touches the images bucket.
  function_s3_put = {
    image_upload_url = true
  }
}

resource "aws_iam_role" "lambda_exec" {
  for_each = toset(local.function_names)

  name = "${var.project_name}-${each.key}-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_iam_role_policy_attachment" "basic_execution" {
  for_each = toset(local.function_names)

  role       = aws_iam_role.lambda_exec[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# One scoped inline policy per function instead of a single shared
# all-tables-all-actions policy, so each Lambda's execution role only grants
# what that specific handler actually calls.
resource "aws_iam_role_policy" "lambda_inline" {
  for_each = toset(local.function_names)

  name = "${var.project_name}-${each.key}-policy-${var.environment}"
  role = aws_iam_role.lambda_exec[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        for resource_arn, actions in lookup(local.function_table_access, each.key, {}) : {
          Effect   = "Allow"
          Action   = actions
          Resource = resource_arn
        }
      ],
      lookup(local.function_sns, each.key, false) ? [{
        Effect   = "Allow"
        Action   = "sns:Publish"
        Resource = var.sns_topic_arn
      }] : [],
      lookup(local.function_s3_put, each.key, false) ? [{
        Effect   = "Allow"
        Action   = "s3:PutObject"
        Resource = "${var.images_bucket_arn}/*"
      }] : [],
      [{
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
        ]
        Resource = "*"
      }],
    )
  })
}

resource "aws_lambda_function" "this" {
  for_each = toset(local.function_names)

  function_name = "${each.key}-${var.environment}"
  role          = aws_iam_role.lambda_exec[each.key].arn
  handler       = "handler.lambda_handler"
  runtime       = "python3.12"
  memory_size   = 256
  timeout       = 30

  # Packages are built by scripts/package_lambdas.sh (Step 8) and don't exist
  # until then, so try() keeps `terraform validate` passing before that runs.
  filename         = "${path.root}/packages/${each.key}.zip"
  source_code_hash = try(filebase64sha256("${path.root}/packages/${each.key}.zip"), null)

  tracing_config {
    mode = "PassThrough"
  }

  environment {
    variables = {
      EVENTS_TABLE        = var.events_table_name
      REGISTRATIONS_TABLE = var.registrations_table_name
      SESSIONS_TABLE      = var.sessions_table_name
      SPEAKERS_TABLE      = var.speakers_table_name
      SNS_TOPIC_ARN       = var.sns_topic_arn
      IMAGES_BUCKET       = var.images_bucket_name
      IMAGES_BUCKET_URL   = var.images_bucket_url
      ENVIRONMENT         = var.environment
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [aws_iam_role_policy.lambda_inline, aws_iam_role_policy_attachment.basic_execution]
}
