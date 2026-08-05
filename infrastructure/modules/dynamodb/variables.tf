variable "environment" {
  description = "Deployment environment (e.g. dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "event-ticketing"
}
