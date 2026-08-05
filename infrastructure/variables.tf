variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "event-ticketing"
}

variable "alert_email" {
  description = "Email address subscribed to CloudWatch alarm notifications"
  type        = string
  default     = "aliutijani21@gmail.com"
}

variable "state_bucket_name" {
  description = "Unused locally; accepted so the CI workflow's -var=\"state_bucket_name=...\" flag (Step 9) doesn't error. The actual backend bucket is hardcoded in backend.tf (Step 10)."
  type        = string
  default     = ""
}
