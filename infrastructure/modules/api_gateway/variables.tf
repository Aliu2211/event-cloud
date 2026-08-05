variable "environment" {
  description = "Deployment environment (e.g. dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "event-ticketing"
}

variable "lambda_invoke_arns" {
  description = "Map of function key (event_create, event_get, ...) to Lambda invoke ARN"
  type        = map(string)
}

variable "lambda_function_names" {
  description = "Map of function key (event_create, event_get, ...) to Lambda function name"
  type        = map(string)
}
