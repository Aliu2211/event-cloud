output "api_id" {
  value = aws_api_gateway_rest_api.main.id
}

output "api_url" {
  value = aws_api_gateway_stage.this.invoke_url
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.organizers.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.organizers.id
}
