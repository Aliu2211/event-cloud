terraform {
  backend "s3" {
    bucket         = "event-ticketing-tf-state-2026"
    key            = "event-ticketing/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "event-ticketing-tf-lock"
    encrypt        = true
  }
}
