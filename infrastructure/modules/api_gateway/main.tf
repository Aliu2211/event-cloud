resource "aws_api_gateway_rest_api" "main" {
  name = "event-ticketing-api-${var.environment}"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# --- Cognito (Step 21): gates organizer-only endpoints -----------------
# Self-service sign-up is enabled by default (admin_create_user_config is
# left unset), so both organizer-portal's /signup flow and the
# `aws cognito-idp admin-create-user` bootstrap in Step 32 work unchanged.
resource "aws_cognito_user_pool" "organizers" {
  name                     = "event-ticketing-organizers-${var.environment}"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_numbers   = true
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cognito_user_pool_client" "organizers" {
  name            = "organizer-portal-client"
  user_pool_id    = aws_cognito_user_pool.organizers.id
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}

resource "aws_api_gateway_authorizer" "cognito" {
  name            = "organizer-cognito-authorizer"
  type            = "COGNITO_USER_POOLS"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  provider_arns   = [aws_cognito_user_pool.organizers.arn]
  identity_source = "method.request.header.Authorization"
}

# --- Resource tree -------------------------------------------------------
resource "aws_api_gateway_resource" "events" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "events"
}

resource "aws_api_gateway_resource" "event_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.events.id
  path_part   = "{event_id}"
}

resource "aws_api_gateway_resource" "register" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.event_id.id
  path_part   = "register"
}

resource "aws_api_gateway_resource" "registrations_by_event" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.event_id.id
  path_part   = "registrations"
}

resource "aws_api_gateway_resource" "sessions_by_event" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.event_id.id
  path_part   = "sessions"
}

resource "aws_api_gateway_resource" "speakers" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "speakers"
}

resource "aws_api_gateway_resource" "speaker_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.speakers.id
  path_part   = "{speaker_id}"
}

resource "aws_api_gateway_resource" "speaker_sessions" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.speaker_id.id
  path_part   = "sessions"
}

resource "aws_api_gateway_resource" "registrations" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "registrations"
}

# Literal alias for the spec's flat POST /register (event_id travels in the
# body instead of the path here); registration_create handles both shapes.
resource "aws_api_gateway_resource" "register_flat" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "register"
}

resource "aws_api_gateway_resource" "registration_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.registrations.id
  path_part   = "{registration_id}"
}

# Sibling to {registration_id}: API Gateway resolves the literal "lookup"
# path ahead of the {registration_id} variable, so these don't conflict.
resource "aws_api_gateway_resource" "registrations_lookup" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.registrations.id
  path_part   = "lookup"
}

resource "aws_api_gateway_resource" "uploads" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "uploads"
}

resource "aws_api_gateway_resource" "upload_image_url" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.uploads.id
  path_part   = "image-url"
}

# --- Routes ----------------------------------------------------------------
# POST /events                          -> event_create               (organizer only)
# GET  /events                          -> event_list                 (public)
# GET  /events/{event_id}               -> event_get                  (public)
# POST /events/{event_id}/register      -> registration_create        (public)
# POST /register                        -> registration_create        (public, flat alias)
# GET  /events/{event_id}/registrations -> registration_list          (organizer only)
# GET  /registrations                   -> registration_list_all      (organizer only)
# GET  /registrations/{registration_id} -> registration_get           (public, also serves ?email as {email})
# DELETE /registrations/{registration_id} -> registration_delete      (public)
# GET  /registrations/lookup?email=     -> registration_lookup_by_email (public)
# POST /events/{event_id}/sessions      -> session_create              (organizer only)
# GET  /events/{event_id}/sessions      -> session_list                (public)
# POST /speakers                        -> speaker_create              (organizer only)
# GET  /speakers                        -> speaker_list                (public)
# GET  /speakers/{speaker_id}           -> speaker_get                 (public)
# GET  /speakers/{speaker_id}/sessions  -> session_list_by_speaker      (public)
# POST /uploads/image-url               -> image_upload_url            (organizer only)
locals {
  routes = {
    event_create = {
      resource_id   = aws_api_gateway_resource.events.id
      http_method   = "POST"
      function_key  = "event_create"
      authorization = "COGNITO_USER_POOLS"
    }
    event_list = {
      resource_id   = aws_api_gateway_resource.events.id
      http_method   = "GET"
      function_key  = "event_list"
      authorization = "NONE"
    }
    event_get = {
      resource_id   = aws_api_gateway_resource.event_id.id
      http_method   = "GET"
      function_key  = "event_get"
      authorization = "NONE"
    }
    registration_create = {
      resource_id   = aws_api_gateway_resource.register.id
      http_method   = "POST"
      function_key  = "registration_create"
      authorization = "NONE"
    }
    # Literal spec alias: POST /register (event_id in the body, not the path).
    registration_create_flat = {
      resource_id   = aws_api_gateway_resource.register_flat.id
      http_method   = "POST"
      function_key  = "registration_create"
      authorization = "NONE"
    }
    registration_list = {
      resource_id   = aws_api_gateway_resource.registrations_by_event.id
      http_method   = "GET"
      function_key  = "registration_list"
      authorization = "COGNITO_USER_POOLS"
    }
    registration_get = {
      resource_id   = aws_api_gateway_resource.registration_id.id
      http_method   = "GET"
      function_key  = "registration_get"
      authorization = "NONE"
    }
    # Cancel registration. Same trust model as registration_get/lookup:
    # knowing the registration_id is the access boundary, no auth required.
    registration_delete = {
      resource_id   = aws_api_gateway_resource.registration_id.id
      http_method   = "DELETE"
      function_key  = "registration_delete"
      authorization = "NONE"
    }
    registration_list_all = {
      resource_id   = aws_api_gateway_resource.registrations.id
      http_method   = "GET"
      function_key  = "registration_list_all"
      authorization = "COGNITO_USER_POOLS"
    }
    registration_lookup_by_email = {
      resource_id   = aws_api_gateway_resource.registrations_lookup.id
      http_method   = "GET"
      function_key  = "registration_lookup_by_email"
      authorization = "NONE"
    }
    session_create = {
      resource_id   = aws_api_gateway_resource.sessions_by_event.id
      http_method   = "POST"
      function_key  = "session_create"
      authorization = "COGNITO_USER_POOLS"
    }
    session_list = {
      resource_id   = aws_api_gateway_resource.sessions_by_event.id
      http_method   = "GET"
      function_key  = "session_list"
      authorization = "NONE"
    }
    speaker_create = {
      resource_id   = aws_api_gateway_resource.speakers.id
      http_method   = "POST"
      function_key  = "speaker_create"
      authorization = "COGNITO_USER_POOLS"
    }
    speaker_list = {
      resource_id   = aws_api_gateway_resource.speakers.id
      http_method   = "GET"
      function_key  = "speaker_list"
      authorization = "NONE"
    }
    speaker_get = {
      resource_id   = aws_api_gateway_resource.speaker_id.id
      http_method   = "GET"
      function_key  = "speaker_get"
      authorization = "NONE"
    }
    session_list_by_speaker = {
      resource_id   = aws_api_gateway_resource.speaker_sessions.id
      http_method   = "GET"
      function_key  = "session_list_by_speaker"
      authorization = "NONE"
    }
    image_upload_url = {
      resource_id   = aws_api_gateway_resource.upload_image_url.id
      http_method   = "POST"
      function_key  = "image_upload_url"
      authorization = "COGNITO_USER_POOLS"
    }
  }
}

resource "aws_api_gateway_method" "this" {
  for_each = local.routes

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value.resource_id
  http_method   = each.value.http_method
  authorization = each.value.authorization
  authorizer_id = each.value.authorization == "COGNITO_USER_POOLS" ? aws_api_gateway_authorizer.cognito.id : null
}

resource "aws_api_gateway_integration" "this" {
  for_each = local.routes

  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = each.value.resource_id
  http_method             = aws_api_gateway_method.this[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = var.lambda_invoke_arns[each.value.function_key]
}

resource "aws_lambda_permission" "apigw" {
  for_each = var.lambda_function_names

  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# --- CORS preflight ------------------------------------------------------
# Both frontends call POST endpoints with a JSON body (registerForEvent,
# event_create), which browsers preflight with an OPTIONS request. Lambda
# proxy integrations don't answer OPTIONS on their own, so every resource
# that has a real method also gets a MOCK-backed OPTIONS response here.
locals {
  cors_resources = {
    events                 = aws_api_gateway_resource.events.id
    event_id               = aws_api_gateway_resource.event_id.id
    register               = aws_api_gateway_resource.register.id
    register_flat          = aws_api_gateway_resource.register_flat.id
    registrations_by_event = aws_api_gateway_resource.registrations_by_event.id
    registrations          = aws_api_gateway_resource.registrations.id
    registration_id        = aws_api_gateway_resource.registration_id.id
    registrations_lookup   = aws_api_gateway_resource.registrations_lookup.id
    sessions_by_event      = aws_api_gateway_resource.sessions_by_event.id
    speakers               = aws_api_gateway_resource.speakers.id
    speaker_id             = aws_api_gateway_resource.speaker_id.id
    speaker_sessions       = aws_api_gateway_resource.speaker_sessions.id
    upload_image_url       = aws_api_gateway_resource.upload_image_url.id
  }
}

resource "aws_api_gateway_method" "options" {
  for_each = local.cors_resources

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options" {
  for_each = local.cors_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

resource "aws_api_gateway_method_response" "options" {
  for_each = local.cors_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options" {
  for_each = local.cors_resources

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = aws_api_gateway_method_response.options[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options]
}

# --- Deployment & stage ------------------------------------------------
resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode(concat(
      [for route in aws_api_gateway_integration.this : route.id],
      [for route in aws_api_gateway_integration.options : route.id],
    )))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [aws_api_gateway_integration.this, aws_api_gateway_integration_response.options]
}

resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
