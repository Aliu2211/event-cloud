output "api_url" {
  value = module.api_gateway.api_url
}

output "events_table_name" {
  value = module.dynamodb.events_table_name
}

output "registrations_table_name" {
  value = module.dynamodb.registrations_table_name
}

output "sns_topic_arn" {
  value = module.sns.topic_arn
}

output "cognito_user_pool_id" {
  value = module.api_gateway.cognito_user_pool_id
}

output "cognito_client_id" {
  value = module.api_gateway.cognito_client_id
}

output "alert_topic_arn" {
  value = module.cloudwatch.alert_topic_arn
}
