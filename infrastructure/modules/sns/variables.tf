variable "environment" {
  description = "Deployment environment (e.g. dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "event-ticketing"
}

variable "alert_email" {
  description = "Email address subscribed to registration confirmation notifications"
  type        = string
}
