output "events_table_name" {
  value = aws_dynamodb_table.events.name
}

output "events_table_arn" {
  value = aws_dynamodb_table.events.arn
}

output "registrations_table_name" {
  value = aws_dynamodb_table.registrations.name
}

output "registrations_table_arn" {
  value = aws_dynamodb_table.registrations.arn
}

output "sessions_table_name" {
  value = aws_dynamodb_table.sessions.name
}

output "sessions_table_arn" {
  value = aws_dynamodb_table.sessions.arn
}

output "speakers_table_name" {
  value = aws_dynamodb_table.speakers.name
}

output "speakers_table_arn" {
  value = aws_dynamodb_table.speakers.arn
}
