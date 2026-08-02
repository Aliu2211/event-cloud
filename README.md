# Event Registration and Ticketing System

Serverless REST API on AWS, with a public attendee portal and a Cognito-protected organizer portal.

getINNOtized x Azubi Africa Capstone | Aliu Tijani

## Stack

AWS Lambda (Python 3.12), API Gateway, DynamoDB, CloudWatch, SNS, Cognito, GitHub Actions, Terraform. Frontend: Next.js (static export) on S3 + CloudFront.

## Structure

```
infrastructure/    Terraform root and modules (dynamodb, lambda, api_gateway, sns, cloudwatch, frontend)
functions/          Lambda handlers (event_create, event_get, event_list, registration_create, registration_get, registration_list)
public-portal/      Attendee-facing Next.js app, no auth
organizer-portal/   Organizer-facing Next.js app, Cognito auth
scripts/            Packaging and deploy scripts
tests/              pytest + moto test suite
.github/workflows/  CI/CD pipeline
```

## Build Order

Follow `EventTicketing_FullBuildSpec (1).md` starting at Step 1. Stop at every STOP AND REPORT checkpoint before continuing.

1. DynamoDB, SNS, Lambda, API Gateway, CloudWatch Terraform modules
2. Root `main.tf` wiring, `terraform init` / `validate`
3. Lambda handler code
4. Packaging script and CI/CD pipeline
5. Remote state bootstrap and first deploy
6. AWS Budgets alert
7. Unit tests
8. Public portal (Next.js, no auth)
9. Cognito authorizer on API Gateway
10. Organizer portal (Next.js, Cognito auth)
11. Dual S3 + CloudFront hosting and deploy
