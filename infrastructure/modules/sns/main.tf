resource "aws_sns_topic" "event_registrations" {
  name = "event-registrations-${var.environment}"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# SNS can't dynamically address a topic to whoever just registered, so this
# subscribes a fixed operator address to every confirmation as a stand-in.
# Real per-attendee delivery would need SES, not just SNS.
resource "aws_sns_topic_subscription" "registration_email" {
  topic_arn = aws_sns_topic.event_registrations.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
