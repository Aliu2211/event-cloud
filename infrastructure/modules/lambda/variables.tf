variable "environment" {
  description = "Deployment environment (e.g. dev, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming and tags"
  type        = string
  default     = "event-ticketing"
}

variable "events_table_name" {
  type = string
}

variable "events_table_arn" {
  type = string
}

variable "registrations_table_name" {
  type = string
}

variable "registrations_table_arn" {
  type = string
}

variable "sessions_table_name" {
  type = string
}

variable "sessions_table_arn" {
  type = string
}

variable "speakers_table_name" {
  type = string
}

variable "speakers_table_arn" {
  type = string
}

variable "sns_topic_arn" {
  type = string
}

variable "images_bucket_name" {
  type = string
}

variable "images_bucket_arn" {
  type = string
}

variable "images_bucket_url" {
  type = string
}
