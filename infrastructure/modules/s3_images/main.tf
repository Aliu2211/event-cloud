data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "images" {
  bucket = "${var.project_name}-images-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Event hero images are marketing assets meant to be viewed publicly on both
# frontends, so objects are world-readable via bucket policy. ACLs stay
# blocked; the policy below is the only public-access path.
resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "images_public_read" {
  bucket = aws_s3_bucket.images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadEventImages"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.images.arn}/*"
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.images]
}

# Uploads happen directly from the browser via a presigned PUT URL (Step
# image_upload_url), so the bucket itself must answer the CORS preflight.
# Origins are wide open since neither frontend has a fixed hosting domain
# yet (S3+CloudFront hosting is still future work); tighten this once they do.
resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}
