module "dynamodb" {
  source = "./modules/dynamodb"

  environment  = var.environment
  project_name = var.project_name
}

module "sns" {
  source = "./modules/sns"

  environment  = var.environment
  project_name = var.project_name
  alert_email  = var.alert_email
}

module "s3_images" {
  source = "./modules/s3_images"

  environment  = var.environment
  project_name = var.project_name
}

module "lambda" {
  source = "./modules/lambda"

  environment              = var.environment
  project_name             = var.project_name
  events_table_name        = module.dynamodb.events_table_name
  events_table_arn         = module.dynamodb.events_table_arn
  registrations_table_name = module.dynamodb.registrations_table_name
  registrations_table_arn  = module.dynamodb.registrations_table_arn
  sessions_table_name      = module.dynamodb.sessions_table_name
  sessions_table_arn       = module.dynamodb.sessions_table_arn
  speakers_table_name      = module.dynamodb.speakers_table_name
  speakers_table_arn       = module.dynamodb.speakers_table_arn
  sns_topic_arn            = module.sns.topic_arn
  images_bucket_name       = module.s3_images.bucket_name
  images_bucket_arn        = module.s3_images.bucket_arn
  images_bucket_url        = module.s3_images.bucket_url
}

module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment           = var.environment
  project_name          = var.project_name
  lambda_function_names = module.lambda.function_names
  alert_email           = var.alert_email
}

module "api_gateway" {
  source = "./modules/api_gateway"

  environment           = var.environment
  project_name          = var.project_name
  lambda_invoke_arns    = module.lambda.invoke_arns
  lambda_function_names = module.lambda.function_names
}
