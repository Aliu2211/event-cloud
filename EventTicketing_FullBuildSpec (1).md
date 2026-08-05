# Event Registration and Ticketing System — Full Build Specification
**Serverless REST API on AWS | getINNOtized x Azubi Africa Capstone**

> Claude Code Build Document | Aliu Tijani | July 2026

| Field | Value |
|---|---|
| Project | Event Registration and Ticketing System |
| Objective | Replace Microsoft Forms + Excel with a scalable serverless REST API on AWS |
| Stack | AWS Lambda (Python 3.12), API Gateway, DynamoDB, CloudWatch, SNS, GitHub Actions, Terraform |
| Region | us-east-1 |
| Developer | Aliu Tijani — aliutijani21@gmail.com |
| Prerequisite | PayTrack Africa complete. All Terraform, Lambda, API Gateway, and CI/CD patterns apply directly. |

---

## Architecture Overview

```
GitHub Repository
       |
  GitHub Actions (CI/CD Pipeline)
       |
  API Gateway (REST Endpoints)
       |
  AWS Lambda (Business Logic)
       |
  DynamoDB (Events and Registrations Tables)
       |
  CloudWatch (Logs and Alarms)
       |
  SNS (Optional — Confirmation Emails)
       |
  AWS Budgets (Cost Tracking — Free Tier)
```

---

## Global Rules for Claude Code

- Stop at every STOP AND REPORT checkpoint before proceeding.
- No manual console clicks for any infrastructure. Everything in Terraform.
- Least privilege IAM on all Lambda roles.
- No em dashes in any generated prose, comments, or documentation.
- Follow all patterns from PayTrack Africa. Module structure, Lambda handler pattern, bootstrap sequence, and GitHub Actions pipeline are identical.

---

## Why Each Service Was Chosen

This section answers the "why behind each architectural decision" as required by the project brief.

**AWS Lambda**: Runs the business logic without a dedicated server. Cost is zero when no events are being registered. Scales automatically to handle event surges like a popular workshop going live. No infrastructure management required.

**API Gateway**: Provides the REST endpoints that the frontend or any HTTP client calls. Handles routing, throttling, and optionally authentication. Sits between the internet and Lambda so Lambda never exposes a public URL directly.

**DynamoDB**: A NoSQL database chosen for its single-digit millisecond read performance and pay-per-request billing. Ideal for event registration where reads vastly outnumber writes and the data model (events with registrations) maps naturally to a key-value structure.

**CloudWatch**: Captures all Lambda execution logs automatically. Used to set alarms when error rates exceed acceptable thresholds, giving the operations team visibility without manually checking logs.

**SNS (Simple Notification Service)**: Sends confirmation emails or SMS notifications to participants after successful registration. Decouples the notification concern from the registration Lambda so a notification failure does not roll back a successful registration.

**GitHub Actions**: Automates the deployment pipeline. Every push to main triggers tests and then deploys the updated Lambda code to AWS without manual steps. This is the CI/CD (Continuous Integration and Continuous Deployment) pipeline.

**AWS Budgets**: Sets a cost alert so the free tier limit is never accidentally exceeded. Sends an email when estimated monthly spend approaches $1.

---

## Complete Project Structure

```
event-ticketing/
├── infrastructure/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── backend.tf                   (empty until Step 6)
│   ├── packages/
│   │   └── .gitkeep
│   └── modules/
│       ├── dynamodb/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       ├── lambda/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       ├── api_gateway/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       ├── sns/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── outputs.tf
│       └── cloudwatch/
│           ├── main.tf
│           ├── variables.tf
│           └── outputs.tf
├── functions/
│   ├── event_create/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── event_get/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── event_list/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── registration_create/
│   │   ├── handler.py
│   │   └── requirements.txt
│   ├── registration_get/
│   │   ├── handler.py
│   │   └── requirements.txt
│   └── registration_list/
│       ├── handler.py
│       └── requirements.txt
├── .github/
│   └── workflows/
│       └── deploy.yml
├── scripts/
│   └── package_lambdas.sh
├── tests/
│   └── test_api.py
├── .gitignore
└── README.md
```

`.gitignore`:
```
infrastructure/packages/*.zip
.terraform/
*.tfstate
*.tfstate.backup
.terraform.lock.hcl
__pycache__/
*.pyc
.env
```

---

# Step 1: DynamoDB Module

Write `infrastructure/modules/dynamodb/main.tf`. Create two tables.

**Table 1: `events-{environment}`**
- Partition key: `event_id` (String)
- Billing: PAY_PER_REQUEST
- PITR enabled
- Attributes to store per item: `event_id`, `event_name`, `description`, `date`, `location`, `capacity` (number), `registered_count` (number, starts at 0), `status` (available/limited/full/cancelled), `created_at`, `updated_at`

**Table 2: `registrations-{environment}`**
- Partition key: `event_id` (String)
- Sort key: `registration_id` (String)
- GSI: `email-index` (PK: `email`, SK: `event_id`, projection ALL) — allows looking up all registrations by a participant's email address
- Billing: PAY_PER_REQUEST
- PITR enabled
- Attributes to store per item: `event_id`, `registration_id`, `participant_name`, `email`, `phone` (optional), `registered_at`, `ticket_number`, `status` (confirmed/cancelled)

Outputs: `events_table_name`, `events_table_arn`, `registrations_table_name`, `registrations_table_arn`

---

# Step 2: SNS Module

Write `infrastructure/modules/sns/main.tf`. Create:
- Topic: `event-registrations-{environment}`
- This topic receives a message after every successful registration and can be subscribed to by email addresses for confirmation notifications

Outputs: `topic_arn`

---

# Step 3: Lambda Module

Write `infrastructure/modules/lambda/main.tf`.

**IAM Role**
- Trust: `lambda.amazonaws.com`
- Attach: `AWSLambdaBasicExecutionRole`
- Inline policy granting:
  - `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:Query`, `dynamodb:Scan` on both table ARNs
  - `sns:Publish` on the SNS topic ARN
  - `xray:PutTraceSegments`, `xray:PutTelemetryRecords`

**Six Lambda Functions (all share these settings)**
- Runtime: `python3.12`
- Handler: `handler.lambda_handler`
- Memory: 256MB
- Timeout: 30 seconds
- Tracing: PassThrough (X-Ray)
- Environment variables: `EVENTS_TABLE`, `REGISTRATIONS_TABLE`, `SNS_TOPIC_ARN`, `ENVIRONMENT`
- Filename: `../packages/{function_name}.zip`

Functions: `event_create`, `event_get`, `event_list`, `registration_create`, `registration_get`, `registration_list`

Outputs: ARN and name of each function

---

# Step 4: API Gateway Module

Write `infrastructure/modules/api_gateway/main.tf`.

**REST API: `event-ticketing-api-{environment}`**

Resource tree:
```
/events                          POST -> event_create,         GET -> event_list
/events/{event_id}               GET  -> event_get
/events/{event_id}/register      POST -> registration_create
/events/{event_id}/registrations GET  -> registration_list
/registrations/{registration_id} GET  -> registration_get
```

- No authentication on any endpoint (public event registration system)
- All integrations: AWS_PROXY, POST integration method
- Deployment with `create_before_destroy` lifecycle and `triggers` block using sha1 of integration IDs
- Stage name: `{environment}`
- Lambda permissions: `apigateway.amazonaws.com` can invoke each function

Outputs: `api_id`, `api_url`

---

# Step 5: CloudWatch Module

Write `infrastructure/modules/cloudwatch/main.tf`.

- CloudWatch log group per Lambda function: `/aws/lambda/{function_name}`, retention 14 days
- Alarm per function: `Errors` metric, period 300s, threshold 5, `GreaterThanOrEqualToThreshold`, treat missing data as `notBreaching`
- SNS alert topic: `event-ticketing-alerts-{environment}` (separate from the registration notifications topic), email subscription via Terraform variable `alert_email`
- All alarms send to the alert topic

Outputs: `alert_topic_arn`

---

# Step 6: Root main.tf and outputs.tf

Write `infrastructure/main.tf` calling all modules in dependency order:
1. `dynamodb` (no deps)
2. `sns` (no deps)
3. `cloudwatch` (no deps)
4. `lambda` (needs dynamodb ARNs and sns ARN)
5. `api_gateway` (needs lambda ARNs)

Root outputs: `api_url`, `events_table_name`, `registrations_table_name`, `sns_topic_arn`

> **STOP AND REPORT** — Run `terraform init` and `terraform validate`. Report full output before writing Lambda handlers.

---

# Step 7: Lambda Handler Code

**All handlers must:**
1. Parse the event from `event['body']` (JSON string) for POST requests
2. Return `{statusCode, headers: {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}, body: json.dumps(...)}`
3. Log a structured JSON object at the start of each invocation
4. Handle errors with try/except and return appropriate HTTP status codes

### event_create — POST /events

Required body: `event_name`, `date` (ISO format YYYY-MM-DD), `location`, `capacity` (integer)
Optional: `description`

Logic:
- `event_id`: `EVT-{uuid4().hex[:10].upper()}`
- `status`: `available`
- `registered_count`: 0
- `created_at` and `updated_at`: `datetime.utcnow().isoformat() + 'Z'`
- Write to events table
- Return 201 with created event

### event_get — GET /events/{event_id}

- `get_item` with Key `{event_id}`
- Return 404 if not found, 200 with event object if found

### event_list — GET /events

- Scan the events table (small dataset — full scan is acceptable)
- Optional query param: `status` — filter by event status
- Return `{events: [...], count: n}`

### registration_create — POST /events/{event_id}/register

Required body: `participant_name`, `email`
Optional: `phone`

Logic:
- First get the event from DynamoDB. Return 404 if not found.
- Check event status: if `full` or `cancelled`, return 400 with `{"error": "Event is not available for registration"}`
- Check for duplicate registration: query `email-index` GSI with `email` and `event_id`. If registration already exists for this email and event, return 409 with `{"error": "You are already registered for this event"}`
- Generate `registration_id`: `REG-{uuid4().hex[:10].upper()}`
- Generate `ticket_number`: `TKT-{event_id[:6]}-{uuid4().hex[:6].upper()}`
- Set `status`: `confirmed`, `registered_at`: current UTC timestamp
- Write registration to registrations table
- Update the event: increment `registered_count` by 1 using `ADD registered_count :inc`
- Update event `status`: if `registered_count + 1 >= capacity`, set status to `full`. If `registered_count + 1 >= capacity * 0.8`, set status to `limited`.
- Publish SNS notification: `"Registration confirmed! Ticket: {ticket_number} for {event_name} on {date}. See you there!"`
- Return 201 with `{registration_id, ticket_number, event_name, date, participant_name, email, status: "confirmed"}`

### registration_get — GET /registrations/{registration_id}

- Query registrations table for the `registration_id`
- Note: since `registration_id` is the sort key, you need to scan or use a GSI. Add a GSI on `registrations-{environment}` table: `registration-id-index` with PK `registration_id`. Add this to the DynamoDB module.
- Return 404 if not found, 200 with registration object if found

### registration_list — GET /events/{event_id}/registrations

- Query registrations table with PK `event_id`
- Return `{registrations: [...], count: n}`

All `requirements.txt` files: `boto3`

> **STOP AND REPORT** — All 6 handlers written and reviewed.

---

# Step 8: Packaging Script

Write `scripts/package_lambdas.sh`:

```bash
#!/bin/bash
set -e

FUNCTIONS=(event_create event_get event_list registration_create registration_get registration_list)
mkdir -p infrastructure/packages

for FUNC in "${FUNCTIONS[@]}"; do
  echo "Packaging $FUNC..."
  cd functions/$FUNC
  pip install -r requirements.txt -t ./package --quiet
  cp handler.py ./package/
  cd package && zip -r ../../../infrastructure/packages/${FUNC}.zip . --quiet
  cd .. && rm -rf package && cd ../..
  echo "$FUNC packaged."
done

echo "All packages created in infrastructure/packages/"
```

> **STOP AND REPORT** — Run `bash scripts/package_lambdas.sh` and confirm 6 zip files exist.

---

# Step 9: GitHub Actions CI/CD Pipeline

Write `.github/workflows/deploy.yml`:

```yaml
name: Event Ticketing Deploy

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  TF_VERSION: 1.6.0

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install test dependencies
        run: pip install pytest boto3 moto
      - name: Run tests
        run: pytest tests/ -v

  deploy:
    name: Package and Deploy
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Package Lambda functions
        run: bash scripts/package_lambdas.sh
      - name: Set up Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TF_VERSION }}
      - name: Terraform Init
        run: terraform init
        working-directory: infrastructure
      - name: Terraform Plan
        run: terraform plan -var="state_bucket_name=${{ secrets.TF_STATE_BUCKET }}"
        working-directory: infrastructure
      - name: Terraform Apply
        run: terraform apply -auto-approve -var="state_bucket_name=${{ secrets.TF_STATE_BUCKET }}"
        working-directory: infrastructure
```

GitHub repository secrets required: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `TF_STATE_BUCKET` (value: `event-ticketing-tf-state-2026`)

---

# Step 10: Bootstrap Remote State and First Deploy

```bash
# Create state bucket
aws s3 mb s3://event-ticketing-tf-state-2026 --region us-east-1
aws s3api put-bucket-versioning \
  --bucket event-ticketing-tf-state-2026 \
  --versioning-configuration Status=Enabled

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name event-ticketing-tf-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

Write `infrastructure/backend.tf`:
```hcl
terraform {
  backend "s3" {
    bucket         = "event-ticketing-tf-state-2026"
    key            = "event-ticketing/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "event-ticketing-tf-lock"
  }
}
```

```bash
bash scripts/package_lambdas.sh
cd infrastructure && terraform init   # type yes to migrate state
terraform plan -var="state_bucket_name=event-ticketing-tf-state-2026"
terraform apply -var="state_bucket_name=event-ticketing-tf-state-2026"
```

> **STOP AND REPORT** — `terraform apply` completes with zero errors. Paste full Outputs block.

---

# Step 11: AWS Budgets Setup

Set up a budget alert to ensure free tier is never exceeded. Run this after the first deploy:

```bash
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "event-ticketing-free-tier",
    "BudgetLimit": {"Amount": "1", "Unit": "USD"},
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ESTIMATED",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "aliutijani21@gmail.com"
    }]
  }]'
```

This sends an email alert when estimated monthly spend exceeds 80 cents.

---

# Step 12: Tests

Write `tests/test_api.py` using `moto`. Required test cases:

**Event tests:**
- `test_create_event_success`: valid payload returns 201 with `event_id`, `status=available`, `registered_count=0`
- `test_create_event_missing_name`: missing `event_name` returns 400
- `test_create_event_missing_capacity`: missing `capacity` returns 400
- `test_get_event_success`: created event retrieved by `event_id`
- `test_get_event_not_found`: non-existent `event_id` returns 404
- `test_list_events_empty`: returns `{events: [], count: 0}`
- `test_list_events_by_status`: only available events returned when `status=available`

**Registration tests:**
- `test_register_success`: valid registration returns 201 with `ticket_number`, `status=confirmed`
- `test_register_missing_email`: missing `email` returns 400
- `test_register_event_not_found`: registering for non-existent event returns 404
- `test_register_full_event`: registering for a full event returns 400
- `test_register_duplicate`: same email registering twice for same event returns 409
- `test_list_registrations`: registrations for an event listed correctly

> **STOP AND REPORT** — All 13 tests pass with `pytest tests/ -v`. Paste full output.

---

# Manual Verification with curl

After deploy, test the live API with these curl commands:

```bash
# Store the API URL from Terraform output
API_URL="https://{your-api-id}.execute-api.us-east-1.amazonaws.com/dev"

# 1. Create an event
curl -X POST $API_URL/events \
  -H "Content-Type: application/json" \
  -d '{
    "event_name": "AWS Workshop Accra 2026",
    "date": "2026-08-15",
    "location": "Accra, Ghana",
    "capacity": 50,
    "description": "Hands-on AWS Lambda and serverless workshop"
  }'

# 2. List all events
curl $API_URL/events

# 3. Register for the event (replace {event_id} with the ID from step 1)
curl -X POST $API_URL/events/{event_id}/register \
  -H "Content-Type: application/json" \
  -d '{
    "participant_name": "Aliu Tijani",
    "email": "aliutijani21@gmail.com",
    "phone": "+233551909162"
  }'

# 4. List registrations for the event
curl $API_URL/events/{event_id}/registrations
```

---

# Acceptance Criteria

The project is complete when all of the following are confirmed:

- All 13 unit tests pass
- `terraform apply` completes with zero errors and outputs `api_url`, `events_table_name`, `registrations_table_name`
- POST /events creates an event and returns `event_id`
- POST /events/{event_id}/register registers a participant, returns `ticket_number`, updates `registered_count` in DynamoDB, and publishes to SNS
- Event status updates to `limited` when 80% capacity is reached and `full` when 100% capacity is reached
- Duplicate registration returns 409
- GitHub Actions pipeline runs green on push to main
- CloudWatch alarms created and visible in AWS console
- AWS Budget alert configured
- `terraform destroy` followed by `terraform apply` recreates the full environment in under 10 minutes

---

# How to Use This Document

Open a Claude Code session. Upload or paste this document. Say:

> "Read this build specification and follow it exactly, starting with Step 1. Stop at every STOP AND REPORT checkpoint before continuing."

When you hit a STOP AND REPORT checkpoint, paste the output before proceeding.

All Terraform module structure, Lambda handler patterns, packaging script, and CI/CD pipeline patterns are identical to PayTrack Africa. Reference that project for any pattern that feels unfamiliar.

---

*Event Registration and Ticketing System | Serverless REST API | Aliu Tijani | July 2026*

---

# Phase 2: Frontend Portal

**New skills: Next.js static site, S3 + CloudFront hosting, API integration without auth**

The project brief shows two UI panels: a registration form (Event Name input, Email Address input, Register button) and an Available Events list showing event name, date, and availability status. This phase builds that portal as a Next.js application deployed to S3 and CloudFront.

---

## Frontend Project Structure

```
event-ticketing/
└── frontend/
    ├── pages/
    │   ├── index.tsx          (home — event list + registration form)
    │   └── confirmation.tsx   (post-registration confirmation page)
    ├── components/
    │   ├── EventCard.tsx      (single event display card)
    │   ├── EventList.tsx      (list of available events)
    │   ├── RegisterForm.tsx   (registration form)
    │   └── StatusBadge.tsx    (available/limited/full badge)
    ├── lib/
    │   └── api.ts             (typed API client)
    ├── styles/
    │   └── globals.css
    ├── public/
    ├── next.config.js
    ├── package.json
    └── tsconfig.json
```

---

## Step 13: Initialise Next.js Frontend

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app
```

---

## Step 14: API Client

Create `frontend/lib/api.ts`. This file contains typed functions that call the deployed API Gateway URL.

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Event {
  event_id: string;
  event_name: string;
  date: string;
  location: string;
  capacity: number;
  registered_count: number;
  status: "available" | "limited" | "full" | "cancelled";
  description?: string;
}

export interface Registration {
  registration_id: string;
  ticket_number: string;
  event_name: string;
  date: string;
  participant_name: string;
  email: string;
  status: string;
}

export async function listEvents(status?: string): Promise<Event[]> {
  const url = status
    ? `${API_URL}/events?status=${status}`
    : `${API_URL}/events`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch events");
  const data = await res.json();
  return data.events;
}

export async function registerForEvent(
  event_id: string,
  payload: { participant_name: string; email: string; phone?: string }
): Promise<Registration> {
  const res = await fetch(`${API_URL}/events/${event_id}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new Error("You are already registered for this event.");
  if (res.status === 400) throw new Error("This event is not available for registration.");
  if (!res.ok) throw new Error("Registration failed. Please try again.");
  return res.json();
}
```

Add `.env.local` to the frontend root:
```
NEXT_PUBLIC_API_URL=https://{your-api-id}.execute-api.us-east-1.amazonaws.com/dev
```

Replace `{your-api-id}` with the value from Terraform output `api_url`.

---

## Step 15: StatusBadge Component

Create `frontend/components/StatusBadge.tsx`:

```tsx
type Status = "available" | "limited" | "full" | "cancelled";

const colours: Record<Status, string> = {
  available: "bg-green-100 text-green-800",
  limited: "bg-yellow-100 text-yellow-800",
  full: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${colours[status]}`}>
      {status}
    </span>
  );
}
```

---

## Step 16: EventCard Component

Create `frontend/components/EventCard.tsx`:

```tsx
import { Event } from "../lib/api";
import { StatusBadge } from "./StatusBadge";

interface Props {
  event: Event;
  onSelect: (event: Event) => void;
  selected: boolean;
}

export function EventCard({ event, onSelect, selected }: Props) {
  const isSelectable = event.status === "available" || event.status === "limited";

  return (
    <div
      onClick={() => isSelectable && onSelect(event)}
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        selected ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-400"
      } ${!isSelectable ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{event.event_name}</h3>
          <p className="text-sm text-gray-500 mt-1">{event.date}</p>
          <p className="text-sm text-gray-500">{event.location}</p>
        </div>
        <StatusBadge status={event.status as any} />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {event.registered_count} / {event.capacity} registered
      </p>
    </div>
  );
}
```

---

## Step 17: RegisterForm Component

Create `frontend/components/RegisterForm.tsx`:

```tsx
import { useState } from "react";
import { Event, registerForEvent, Registration } from "../lib/api";

interface Props {
  event: Event;
  onSuccess: (registration: Registration) => void;
}

export function RegisterForm({ event, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const registration = await registerForEvent(event.event_id, {
        participant_name: name,
        email,
        phone: phone || undefined,
      });
      onSuccess(registration);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Event Registration</h2>
      <p className="text-sm text-blue-600 font-medium mb-4">{event.event_name}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="participant@email.com"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+233 55 190 9162"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}
```

---

## Step 18: Home Page

Create `frontend/pages/index.tsx` (or `frontend/app/page.tsx` if using the App Router):

```tsx
"use client";
import { useEffect, useState } from "react";
import { Event, Registration, listEvents } from "../lib/api";
import { EventCard } from "../components/EventCard";
import { RegisterForm } from "../components/RegisterForm";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .catch(() => setError("Failed to load events. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  function handleSuccess(reg: Registration) {
    setRegistration(reg);
    setSelectedEvent(null);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Registration</h1>
          <p className="text-gray-500 mt-1">Browse available events and register your spot.</p>
        </div>

        {registration && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <h2 className="font-bold text-green-800 mb-1">Registration Confirmed!</h2>
            <p className="text-green-700 text-sm">
              Your ticket number is <span className="font-mono font-bold">{registration.ticket_number}</span>.
              A confirmation has been sent to {registration.email}.
            </p>
            <button
              onClick={() => setRegistration(null)}
              className="text-green-600 text-sm underline mt-2"
            >
              Register for another event
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Available Events</h2>
            {loading && <p className="text-gray-400 text-sm">Loading events...</p>}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {!loading && events.length === 0 && (
              <p className="text-gray-400 text-sm">No events currently available.</p>
            )}
            <div className="space-y-3">
              {events.map(event => (
                <EventCard
                  key={event.event_id}
                  event={event}
                  onSelect={setSelectedEvent}
                  selected={selectedEvent?.event_id === event.event_id}
                />
              ))}
            </div>
          </div>

          <div>
            {selectedEvent ? (
              <RegisterForm event={selectedEvent} onSuccess={handleSuccess} />
            ) : (
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
                Select an event from the list to register.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
```

---

## Step 19: Terraform Module for Frontend Hosting

Add `infrastructure/modules/frontend/main.tf`:

```hcl
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${var.environment}"
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3-frontend"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  enabled             = true
  default_root_object = "index.html"
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  restrictions {
    geo_restriction { restriction_type = "none" }
  }
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

Outputs: `frontend_bucket_name`, `cloudfront_url`

---

## Step 20: Build and Deploy Frontend

```bash
# Set the API URL in the environment file
echo "NEXT_PUBLIC_API_URL=$(cd infrastructure && terraform output -raw api_url)" > frontend/.env.local

# Build the Next.js app as a static export
cd frontend
npm install
npm run build

# Sync the built output to S3
aws s3 sync out/ s3://$(cd ../infrastructure && terraform output -raw frontend_bucket_name) --delete

# Invalidate CloudFront cache so changes appear immediately
aws cloudfront create-invalidation \
  --distribution-id $(cd ../infrastructure && terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

Add `"output": "export"` to `next.config.js` to enable static export:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
};
module.exports = nextConfig;
```

> **STOP AND REPORT** — Frontend deployed. Visit the CloudFront URL and confirm the event list loads, selecting an event shows the registration form, and completing registration shows the ticket number confirmation.

---

## Updated Acceptance Criteria

In addition to the original 10 criteria, the project is complete when:

- Frontend loads at the CloudFront URL over HTTPS
- Available events list displays all events from the API with correct status badges
- Selecting an event loads the registration form on the right panel
- Submitting the form registers the participant and shows the ticket number confirmation
- Full event shows as unselectable (greyed out, no form displayed)
- Duplicate registration shows a clear error message without crashing the page

---

*Event Registration and Ticketing System | Frontend Addendum | Aliu Tijani | July 2026*

---

# Phase 3: Dual Portal Frontend

**Replaces the single-portal Phase 2 frontend. Two separate Next.js applications: one public, one for organizers.**

> This phase requires Phase 1 (Steps 1 to 12) to be fully deployed before starting.

---

## Architecture Decision: Two Portals, One API

The backend API from Phase 1 remains unchanged. What changes is how it is accessed:

- **Public portal**: reads from GET /events and writes to POST /events/{id}/register. No authentication. Deployed at the public CloudFront URL.
- **Organizer portal**: reads and writes to all endpoints including POST /events and GET /events/{id}/registrations. Protected by AWS Cognito. Deployed at a separate CloudFront URL.

This keeps attendee experience fast and frictionless while giving organizers full management capability behind a login screen.

---

## Updated Project Structure

```
event-ticketing/
├── infrastructure/          (unchanged + Cognito added in Step 21)
├── functions/               (unchanged from Phase 1)
├── public-portal/           (attendee-facing Next.js app)
│   ├── app/
│   │   ├── page.tsx         (event list + registration form)
│   │   └── ticket/[id]/page.tsx  (ticket lookup page)
│   ├── components/
│   │   ├── EventCard.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── StatusBadge.tsx
│   │   └── TicketView.tsx
│   ├── lib/
│   │   └── api.ts           (public API calls only, no auth)
│   ├── .env.local
│   ├── next.config.js       (output: export)
│   └── package.json
├── organizer-portal/        (organizer-facing Next.js app)
│   ├── app/
│   │   ├── login/page.tsx   (Cognito login form)
│   │   ├── dashboard/page.tsx    (event list with management actions)
│   │   ├── events/new/page.tsx   (create event form)
│   │   ├── events/[id]/page.tsx  (event detail + registrations table)
│   │   └── layout.tsx       (auth guard: redirects to /login if no session)
│   ├── components/
│   │   ├── EventTable.tsx
│   │   ├── CreateEventForm.tsx
│   │   ├── RegistrationTable.tsx
│   │   └── StatusBadge.tsx
│   ├── lib/
│   │   ├── api.ts           (authenticated API calls)
│   │   └── auth.ts          (Cognito Amplify config)
│   ├── .env.local
│   ├── next.config.js       (output: export)
│   └── package.json
└── scripts/
    └── deploy-portals.sh    (builds and deploys both portals)
```

---

## Step 21: Update API Gateway for Organizer Auth

Add a Cognito user pool and authorizer to the API Gateway Terraform module. Apply the authorizer to these endpoints only:
- `POST /events` (create event) — organizer only
- `GET /events/{event_id}/registrations` (view registrations) — organizer only

Leave these open (no auth):
- `GET /events` — public
- `GET /events/{event_id}` — public
- `POST /events/{event_id}/register` — public
- `GET /registrations/{registration_id}` — public

Add to `infrastructure/modules/api_gateway/main.tf`:

```hcl
resource "aws_cognito_user_pool" "organizers" {
  name                     = "event-ticketing-organizers-${var.environment}"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  password_policy {
    minimum_length    = 8
    require_uppercase = true
    require_numbers   = true
  }
}

resource "aws_cognito_user_pool_client" "organizers" {
  name         = "organizer-portal-client"
  user_pool_id = aws_cognito_user_pool.organizers.id
  generate_secret = false
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
}

resource "aws_api_gateway_authorizer" "cognito" {
  name            = "organizer-cognito-authorizer"
  type            = "COGNITO_USER_POOLS"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  provider_arns   = [aws_cognito_user_pool.organizers.arn]
  identity_source = "method.request.header.Authorization"
}
```

Add outputs: `cognito_user_pool_id`, `cognito_client_id`

Run `terraform apply` after making these changes.

> **STOP AND REPORT** — Confirm `POST /events` without a JWT token returns 401 Unauthorized. Confirm `GET /events` still returns events without a token.

---

# Public Attendee Portal
**No authentication | Browse events, register, view ticket | Public CloudFront URL**

## Step 22: Initialise Public Portal

```bash
cd public-portal
npx create-next-app@latest . --typescript --tailwind --app
```

`next.config.js`:
```js
const nextConfig = { output: 'export' };
module.exports = nextConfig;
```

`.env.local`:
```
NEXT_PUBLIC_API_URL=https://{api-id}.execute-api.us-east-1.amazonaws.com/dev
```

## Step 23: Public API Client — public-portal/lib/api.ts

Contains only public-facing calls. No Authorization header is ever sent from this portal.

```typescript
const API = process.env.NEXT_PUBLIC_API_URL;

export async function listEvents(status?: string) {
  const url = status ? `${API}/events?status=${status}` : `${API}/events`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load events');
  return (await res.json()).events;
}

export async function getEvent(event_id: string) {
  const res = await fetch(`${API}/events/${event_id}`);
  if (res.status === 404) return null;
  return res.json();
}

export async function registerForEvent(
  event_id: string,
  payload: { participant_name: string; email: string; phone?: string }
) {
  const res = await fetch(`${API}/events/${event_id}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) throw new Error('Already registered for this event.');
  if (res.status === 400) throw new Error('This event is not available.');
  if (!res.ok) throw new Error('Registration failed. Please try again.');
  return res.json();
}

export async function getRegistration(registration_id: string) {
  const res = await fetch(`${API}/registrations/${registration_id}`);
  if (res.status === 404) return null;
  return res.json();
}
```

## Step 24: Public Portal Pages and Components

### app/page.tsx — Home Page
- Left panel: loads all events on mount, renders EventCard list
- Clicking an EventCard sets `selectedEvent` in state
- Right panel: shows RegisterForm when event selected, placeholder when none
- On successful registration: shows TicketView with ticket number, event name, date, participant name
- TicketView includes link to `/ticket/{registration_id}` for future lookup

### app/ticket/[id]/page.tsx — Ticket Lookup Page
- Reads `registration_id` from URL params
- Calls `getRegistration(id)` on mount
- If found: renders TicketView with full registration details
- If not found: shows "Ticket not found" message with link back to home
- Allows attendees to retrieve their ticket at any time via bookmarked URL

### Components
- **StatusBadge**: `available` (green), `limited` (yellow), `full` (red), `cancelled` (grey)
- **EventCard**: shows event_name, date, location, StatusBadge, capacity fill progress. Disabled (greyed out, not selectable) when full or cancelled.
- **RegisterForm**: Full Name (required), Email Address (required), Phone (optional), Register button. Handles loading state and inline error display.
- **TicketView**: ticket_number in large monospace font, event_name, date, participant_name, email, status. Print-friendly layout.

---

# Organizer Management Portal
**Cognito authentication required | Create events, view registrations, manage capacity | Separate CloudFront URL**

## Step 25: Initialise Organizer Portal

```bash
cd organizer-portal
npx create-next-app@latest . --typescript --tailwind --app
npm install aws-amplify @aws-amplify/ui-react
```

`next.config.js`:
```js
const nextConfig = { output: 'export' };
module.exports = nextConfig;
```

`.env.local`:
```
NEXT_PUBLIC_API_URL=https://{api-id}.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_COGNITO_USER_POOL_ID={from terraform output cognito_user_pool_id}
NEXT_PUBLIC_COGNITO_CLIENT_ID={from terraform output cognito_client_id}
```

## Step 26: Cognito Auth Config — organizer-portal/lib/auth.ts

```typescript
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    }
  }
});
```

Import this file in root `layout.tsx` so it runs before any page renders.

## Step 27: Organizer API Client — organizer-portal/lib/api.ts

All protected calls attach the Cognito JWT token in the Authorization header.

```typescript
import { fetchAuthSession } from 'aws-amplify/auth';

async function authHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return { 'Content-Type': 'application/json', Authorization: token };
}

const API = process.env.NEXT_PUBLIC_API_URL;

// Public reads (no auth)
export async function listEvents(status?: string) {
  const url = status ? `${API}/events?status=${status}` : `${API}/events`;
  const res = await fetch(url);
  return (await res.json()).events;
}

export async function getEvent(event_id: string) {
  const res = await fetch(`${API}/events/${event_id}`);
  return res.json();
}

// Protected writes (auth required)
export async function createEvent(payload: {
  event_name: string; date: string; location: string;
  capacity: number; description?: string;
}) {
  const res = await fetch(`${API}/events`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

export async function listRegistrations(event_id: string) {
  const res = await fetch(`${API}/events/${event_id}/registrations`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load registrations');
  return (await res.json()).registrations;
}
```

## Step 28: Auth Guard — app/layout.tsx

Wraps every organizer portal page. Redirects unauthenticated users to `/login`.

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import '../lib/auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(() => setChecking(false))
      .catch(() => {
        if (pathname !== '/login') router.replace('/login');
        setChecking(false);
      });
  }, [pathname]);

  if (checking) return <div className="p-8 text-gray-400">Loading...</div>;
  return <>{children}</>;
}
```

## Step 29: Organizer Portal Pages and Components

### app/login/page.tsx — Login Page
- Email and password form
- On submit: calls `signIn` from `aws-amplify/auth`
- On success: redirects to `/dashboard`
- On error: shows inline error message
- If already signed in: redirects immediately to `/dashboard`

### app/dashboard/page.tsx — Event Management Dashboard
- Header with "Organizer Dashboard" title and Sign Out button (calls `signOut`, redirects to `/login`)
- Create Event button in top right linking to `/events/new`
- EventTable showing all events: Event Name, Date, Location, Capacity, Registered, Status, Actions
- Capacity fill shown as a progress bar: `registered_count / capacity`
- Actions column: View Registrations button links to `/events/{id}`

### app/events/new/page.tsx — Create Event Form
- Fields: Event Name (required), Date (date picker, required), Location (required), Capacity (number, required), Description (textarea, optional)
- On submit: calls `createEvent()` from organizer api.ts
- On success: redirects to `/dashboard`
- On error: shows inline error message

### app/events/[id]/page.tsx — Event Detail and Registrations
- Event details card: all fields, StatusBadge, capacity progress bar
- RegistrationTable: Ticket Number, Participant Name, Email, Phone, Registered At, Status
- CSV Export button: generates and downloads a CSV file client-side from the registrations array
- CSV export implementation (no backend needed):
```typescript
const csv = ['Ticket,Name,Email,Phone,Date']
  .concat(registrations.map(r =>
    [r.ticket_number, r.participant_name, r.email, r.phone || '', r.registered_at].join(',')
  )).join('\n');
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'registrations.csv'; a.click();
```

### Components
- **StatusBadge**: same as public portal
- **EventTable**: sortable by date, capacity progress bar per row
- **CreateEventForm**: form with validation and loading state
- **RegistrationTable**: table with CSV export button

---

## Step 30: Terraform — Two S3 Buckets and Two CloudFront Distributions

Update `infrastructure/modules/frontend/main.tf` to create separate hosting for each portal:

**Public Portal**
- S3 bucket: `event-ticketing-public-{environment}`
- Public read access, static website hosting, index.html default
- CloudFront distribution with HTTPS redirect
- Outputs: `public_cloudfront_url`, `public_bucket_name`, `public_cloudfront_distribution_id`

**Organizer Portal**
- S3 bucket: `event-ticketing-organizer-{environment}`
- Public read access, static website hosting
- Separate CloudFront distribution with HTTPS redirect
- Outputs: `organizer_cloudfront_url`, `organizer_bucket_name`, `organizer_cloudfront_distribution_id`

Run `terraform apply` to create both buckets and distributions before deploying the portals.

---

## Step 31: Deploy Both Portals

Create `scripts/deploy-portals.sh`:

```bash
#!/bin/bash
set -e

echo 'Reading Terraform outputs...'
API_URL=$(cd infrastructure && terraform output -raw api_url)
PUBLIC_BUCKET=$(cd infrastructure && terraform output -raw public_bucket_name)
ORGANIZER_BUCKET=$(cd infrastructure && terraform output -raw organizer_bucket_name)
PUBLIC_CF=$(cd infrastructure && terraform output -raw public_cloudfront_distribution_id)
ORGANIZER_CF=$(cd infrastructure && terraform output -raw organizer_cloudfront_distribution_id)
POOL_ID=$(cd infrastructure && terraform output -raw cognito_user_pool_id)
CLIENT_ID=$(cd infrastructure && terraform output -raw cognito_client_id)

echo 'Building public portal...'
echo "NEXT_PUBLIC_API_URL=${API_URL}" > public-portal/.env.local
cd public-portal && npm install && npm run build && cd ..
aws s3 sync public-portal/out/ s3://${PUBLIC_BUCKET} --delete
aws cloudfront create-invalidation --distribution-id ${PUBLIC_CF} --paths '/*'

echo 'Building organizer portal...'
cat > organizer-portal/.env.local << EOF
NEXT_PUBLIC_API_URL=${API_URL}
NEXT_PUBLIC_COGNITO_USER_POOL_ID=${POOL_ID}
NEXT_PUBLIC_COGNITO_CLIENT_ID=${CLIENT_ID}
EOF
cd organizer-portal && npm install && npm run build && cd ..
aws s3 sync organizer-portal/out/ s3://${ORGANIZER_BUCKET} --delete
aws cloudfront create-invalidation --distribution-id ${ORGANIZER_CF} --paths '/*'

echo 'Both portals deployed.'
echo "Public portal: $(cd infrastructure && terraform output -raw public_cloudfront_url)"
echo "Organizer portal: $(cd infrastructure && terraform output -raw organizer_cloudfront_url)"
```

Run with: `bash scripts/deploy-portals.sh`

---

## Step 32: Create First Organizer Account

```bash
aws cognito-idp admin-create-user \
  --user-pool-id $(cd infrastructure && terraform output -raw cognito_user_pool_id) \
  --username aliutijani21@gmail.com \
  --user-attributes Name=email,Value=aliutijani21@gmail.com \
  --temporary-password TempPass123! \
  --region us-east-1
```

On first login, Cognito prompts the organizer to set a permanent password.

> **STOP AND REPORT** — Both portals deployed. Confirm: (1) public portal loads and registration works without login. (2) Organizer portal redirects to /login when not authenticated. (3) After login, organizer can create events and view registrations. (4) CSV export downloads correctly. (5) New event created by organizer appears immediately in the public portal event list.

---

## Full Project Acceptance Criteria

### Backend (Steps 1 to 12)
- All 13 unit tests pass
- `terraform apply` completes with zero errors
- `POST /events` requires JWT token and returns 401 without one
- `GET /events` returns events without any authentication
- Registration flow: creates registration, updates event capacity, publishes SNS confirmation
- Duplicate registration returns 409
- GitHub Actions pipeline green on push to main

### Public Attendee Portal
- Loads at the public CloudFront URL over HTTPS
- Event list shows all events with correct status badges
- Registration form submits without requiring login
- Successful registration shows ticket number and event details
- Full events are greyed out and unselectable
- Ticket lookup page `/ticket/{id}` retrieves and displays the registration
- Duplicate registration shows a clear error message

### Organizer Portal
- Loads at the separate organizer CloudFront URL over HTTPS
- Unauthenticated access redirects to /login immediately
- Login with Cognito credentials works and redirects to /dashboard
- Dashboard shows all events with capacity progress bars
- Create Event form creates a new event visible in both portals
- Event detail page shows all registrations in a table
- CSV export downloads a correctly formatted file
- Sign Out button ends the session and redirects to /login

---

*Event Registration and Ticketing System | Phase 3 Dual Portal | Aliu Tijani | July 2026*

---

# Frontend Reconciliation Addendum

Both frontends (`organizer-portal`, `public-portal`) were built against this spec using Stitch-derived UI designs before the backend existed. This addendum is the source of truth for Steps 1-7 and Step 21 going forward wherever it conflicts with anything implied by the mockups. Build the backend to match this section, not the decorative UI details below it.

## Confirmed contract (build backend to match exactly)

- **Event fields**: `event_id`, `event_name`, `description`, `date` (ISO `YYYY-MM-DD`), `location`, `capacity`, `registered_count`, `status`, `created_at`, `updated_at`. No ticket tiers, pricing, venue type, or branding fields exist anywhere in the system, since the organizer Configuration Studio's "Ticketing Inventory" and "Event Branding" sections are decorative mock UI from the Stitch export. Do not add those fields to `event_create`.
- **Event status enum is exactly**: `available | limited | full | cancelled`, set automatically by the backend. `event_create` always sets `available`; `registration_create` recalculates `limited`/`full` at 80%/100% capacity. There is no "draft" state and no publish workflow: events go live immediately on creation. The organizer Configuration Studio's "Save as Draft" button and the Events list's "Draft" status badge are presentation-only relics from the Stitch mock. When wiring real data, bind "Publish Event" (not "Save as Draft") to `POST /events` and drop the draft badge/filter.
- **Registration fields**: `event_id`, `registration_id`, `participant_name`, `email`, `phone` (optional), `registered_at`, `ticket_number`, `status` (`confirmed | cancelled` only, no "pending"). The organizer Attendees page's ticket-type pills (VIP Pass / Early Bird / General) and "Pending Payments" stat are decorative; there is no payment processing or ticket-tier concept anywhere in this system.
- `public-portal/lib/api.ts` implements this contract exactly (`listEvents`, `getEvent`, `registerForEvent`, `getRegistration`, `getRegistrationsByEmail`, `listSessions`, `listSpeakers`, `getSpeaker`, `listSessionsBySpeaker`) and falls back to in-memory mock data whenever `NEXT_PUBLIC_API_URL` is unset. `public-portal/.env.local` now points this at the live deployed API (see Deployment status below), so it runs against real data by default in this environment.

## Two registration endpoints added beyond the original Step 4/7 design

Two gaps surfaced when the frontends were reviewed against the deployed API: the organizer Attendees page implies a platform-wide registrant list, and the public My Tickets page implies self-service lookup by email, neither of which the original 6 handlers support. Both are now real, deployed, and covered by `tests/test_api.py`:

- **`GET /registrations`** maps to `registration_list_all`. Full scan of the registrations table, organizer-only (Cognito-gated), since it returns every attendee's name/email/phone across every event. Powers `organizer-portal`'s Attendees page, which is now wired to it directly (see Deployment status below).
- **`GET /registrations/lookup?email=...`** maps to `registration_lookup_by_email`. Queries the `email-index` GSI (the same one `registration_create` already used server-side for duplicate detection, now also exposed to callers) and returns every registration for that one email across all events. Public, no auth: querying by an email you already know is the same trust model as any "look up my order" flow, and it can't be used to enumerate other attendees. Returns 400 if `email` is omitted. `public-portal/my-tickets` calls this directly through `lib/api.ts` now, no longer client-side mock filtering.

Both live under the existing `/registrations` resource: `GET /registrations` (top-level, list-all) and `GET /registrations/lookup` (literal child, sibling to `{registration_id}`). API Gateway resolves the literal path ahead of the variable one, so there's no route conflict.

## Sessions and speakers: a real feature, added after the initial build

The original Step 1 data model has no concept of sessions or speakers; `/schedule` and `/speakers/[slug]` in `public-portal` originally rendered mock content only. This was deliberately promoted to a real feature (new tables, new endpoints, new frontend wiring), not left as decoration, after review. It follows the same partition-per-parent pattern as `events`/`registrations`.

**New tables** (`infrastructure/modules/dynamodb`):
- `sessions-{environment}`: partition key `event_id`, sort key `session_id`. GSI `speaker-index` (PK `speaker_id`) looks up all of a speaker's sessions across every event. `speaker_id` is omitted from the item entirely when a session has no speaker, since DynamoDB rejects empty strings as GSI key values, unlike ordinary attributes.
- `speakers-{environment}`: partition key `speaker_id`. No sort key or GSI.

**New endpoints** (all covered by `tests/test_api.py`, all CORS-enabled):
- `POST /events/{event_id}/sessions` maps to `session_create` (organizer only). Required: `day`, `time`, `title`, `location`. Optional: `track`, `description`, `speaker_id`. Returns 404 if the event doesn't exist.
- `GET /events/{event_id}/sessions` maps to `session_list` (public). Query by `event_id`, returns `{sessions, count}`.
- `POST /speakers` maps to `speaker_create` (organizer only). Required: `name`, `role`. Optional: `bio`, `expertise` (array), `years_experience`, `talks_delivered`.
- `GET /speakers` maps to `speaker_list` (public). Full scan, returns `{speakers, count}`.
- `GET /speakers/{speaker_id}` maps to `speaker_get` (public). 404 if not found.
- `GET /speakers/{speaker_id}/sessions` maps to `session_list_by_speaker` (public). Queries the `speaker-index` GSI, returns that speaker's sessions across every event.

**Frontend**: `/schedule` moved from a flat, single-hardcoded-event route to `public-portal/app/events/[id]/schedule/page.tsx`, since sessions are genuinely per-event now. The event detail page's "View full schedule" link is no longer gated behind a single flagship event ID; every event links to its own schedule. `public-portal/app/speakers/[slug]` was renamed to `app/speakers/[id]` (the param is a `speaker_id`, not a human slug) and now cross-references sessions and their parent events for real. The top nav's global "Schedule" link was removed, since there's no longer a single schedule to point it at.

**Not built**: an organizer-facing UI to create speakers. `organizer-portal`'s Event Detail "Add Session" button now opens a real modal (`components/AddSessionModal.tsx`) that calls `session_create` and picks an existing speaker from a dropdown fed by `speaker_list`, but there is no UI to create a *new* speaker — new speakers still have to be seeded directly via the API using an operator's own Cognito token.

## Event images: a real feature, added after organizer-portal was wired

Create Event's "Event Branding" section originally had a decorative hero-image upload with no backend behind it (see below). It was promoted to a real feature after a user asked why event images weren't showing on the Events list — the icons there turned out to be from an invented mock `icon` field with nothing real behind it either.

**New infrastructure** (`infrastructure/modules/s3_images`): an `event-ticketing-images-{environment}-{account_id}` S3 bucket. Objects are world-readable via bucket policy (event hero images are public marketing assets, same trust model as the images on any public event page); ACLs stay blocked. CORS is wide open (`allowed_origins = ["*"]`) since neither frontend has a fixed hosting domain yet (S3+CloudFront hosting is still future work) — browsers need bucket-level CORS to complete a direct PUT upload even with a valid presigned URL, so this had to be configured for the upload flow to work at all. Tighten origins once real hosting domains exist.

**New endpoint**: `POST /uploads/image-url` maps to `image_upload_url` (organizer only, covered by `tests/test_api.py`). Takes `{content_type}` (must be `image/jpeg`, `image/png`, or `image/webp`), returns a presigned S3 PUT URL plus the final public `image_url`. The upload itself happens directly from the browser straight to S3 (not proxied through the Lambda/API Gateway, which would hit payload-size limits for anything but tiny images); the org-portal or public event only needs to record the resulting URL string.

**`event_create` change**: accepts an optional `image_url` in the request body and stores it verbatim on the event item if present — no validation that it's actually a URL from this bucket, same trust model as any other organizer-supplied field. The upload has to complete *before* `POST /events` is called, since `event_create` generates the `event_id` server-side and there's no `event_update` endpoint to attach an image after the fact.

**Frontend**: `organizer-portal/app/(console)/events/new/page.tsx` has a real "Event Image" section (file picker, local preview via `URL.createObjectURL`, uploads on submit through `lib/api.ts`'s `uploadEventImage()`). The Events list and Event Detail pages show the real image when present, falling back to a generic icon when not. `public-portal`'s `EventCard` and event detail hero both render the real image the same way. No image-editing, cropping, or replacement UI exists — uploading a new image on an existing event isn't supported, since there's no `event_update` endpoint.

## Not backed by any Lambda (frontend-only, mock data, do not build backend support for these)

- **Organizer**: Configuration Studio's Ticketing Inventory section (price tiers) and Event Branding's accent-color/live-preview sub-section were removed outright (not just left mock) when Create Event was wired to `POST /events`, since there's no ticket-tier, pricing, or branding-color field anywhere in the schema. Event Branding's hero-image upload, however, is now a real feature (see above), not mock. Settings' Organization Profile, Team Management, API & Integrations, and Billing tabs remain entirely mock — there is no organization/team/billing concept in this system at all, and Settings was intentionally left out of the real-data wiring pass. Dashboard's Quick Actions panel is real (links only); its old Recent Activity and Top Performer panels were replaced with ones computed from real registrations and events (see Deployment status). Event Detail's old Traffic Sources and Optimization Tip panel was removed (no analytics data exists to back it); its Registrations/Sessions/Status stat cards are all derived from real data instead.

## Auth reconciliation (Step 21), resolved

- Self-service sign-up needed no extra Cognito configuration: `admin_create_user_config` was left unset on `aws_cognito_user_pool.organizers`, which defaults to allowing public sign-up. Both `organizer-portal`'s real `/signup` call and the `admin-create-user` bootstrap coexist without conflict.
- `organizer-portal`'s `/login`, `/signup`, and `/forgot-password` pages are now wired to real Amplify calls (`signIn`, `signUp`, `confirmSignUp`, `resetPassword`, `confirmResetPassword` from `aws-amplify/auth`, in `organizer-portal/lib/auth.ts`). The "Organization Name" field on `/signup` was dropped: `aws_cognito_user_pool.organizers` has no custom schema attribute to store it in, and adding one wasn't worth a Terraform change for a field nothing reads.
- **Auth flow gotcha**: `aws_cognito_user_pool_client.organizers` only enables `ALLOW_USER_PASSWORD_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH` (no SRP). Amplify's `signIn()` defaults to `USER_SRP_AUTH` and fails with `"USER_SRP_AUTH is not enabled for the client"` unless called with `options: { authFlowType: "USER_PASSWORD_AUTH" }` — caught via a real browser login attempt, not by the type-checker or tests, since Amplify accepts the option silently either way.
- `app/(console)/layout.tsx` now wraps every console route in `components/AuthGuard.tsx`, a client component that calls `getCurrentUser()` on mount and redirects to `/login` if there's no session. `components/Topbar.tsx` shows the signed-in user's email and a working Sign Out control (`signOut()` then redirect to `/login`).

## Field-naming note

`organizer-portal` is now on the same contract as `public-portal`: `event_id` / `event_name` / `registered_count` / ... field names throughout, and the `available | limited | full | cancelled` status enum. Unlike `public-portal/lib/api.ts`, `organizer-portal/lib/api.ts` has no mock-data fallback branch — `organizer-portal/lib/mock-data.ts` was deleted rather than rewritten, and the real API types (`EventRecord`, `Registration`, `Session`, `Speaker`) live directly in `lib/api.ts`. This was a deliberate choice: by the time `organizer-portal` was wired, the backend was already live and stable, so a "no API configured" fallback mode had no real use case left and would only have been dead code to maintain. `organizer-portal/lib/api.ts` implements `listEvents`, `getEvent`, `createEvent`, `listRegistrations`, `listAllRegistrations`, `listSessions`, `createSession`, `listSpeakers`, and `createRegistration` (used by the Attendees page's "Add Attendee" modal, which calls the same public `registration_create` endpoint `public-portal` uses).

## Deployment status

The backend is live in AWS (`us-east-1`, account `343073438650`, stage `dev`) with all 16 Lambda functions, all four DynamoDB tables (`events`, `registrations`, `sessions`, `speakers`), one S3 bucket for event images, the Cognito user pool, CloudWatch alarms, and a $1 monthly budget alert. Both frontends are fully wired to it. `public-portal` uses `.env.local` with `NEXT_PUBLIC_API_URL` and falls back to mock data if unset; verified end-to-end (list, detail, register, ticket lookup, email lookup, schedule, speakers, CORS, event images). `organizer-portal` uses `.env.local` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_COGNITO_USER_POOL_ID`, and `NEXT_PUBLIC_COGNITO_CLIENT_ID`, with no fallback mode (see Field-naming note); verified end-to-end through a real browser session — Cognito login (including the `USER_PASSWORD_AUTH` flow fix above), dashboard metrics, event list/detail, Create Event (including image upload), Add Session, Attendees list/filter/CSV export/Add Attendee, and Sign Out. The image upload flow (presign → direct browser PUT to S3 → public GET) was verified independently via curl, including the auth boundary and content-type validation.

Note: the API URL, Cognito user pool ID, and Cognito client ID above are the *original* deployment. The whole stack was destroyed and redeployed once since (see "Gap closure against the literal rubric" below), so the current live values are whatever the latest `terraform apply` output and both `.env.local` files say — check those rather than this paragraph for the current endpoint.

## Gap closure against the literal rubric

A later review compared the deployed system against the assignment slide deck's literal Phase 2/3/4 requirements (not just the reconciled contract above) and found six gaps. All are now closed:

- **`DELETE /registrations/{id}` didn't exist.** The spec's four required endpoints include cancellation; only 3 of the 4 had been built. Added `registration_delete` (`functions/registration_delete/handler.py`): looks the registration up by ID via the `registration-id-index` GSI, soft-cancels it (`status` → `cancelled`, plus a `cancelled_at` timestamp — the record stays, it isn't hard-deleted), and decrements the parent event's `registered_count`, recalculating `available`/`limited`/`full` the same way `registration_create` does in reverse. Returns 404 if the ID doesn't exist, 400 if it's already cancelled. The spec's path is singular (`/registration/{id}`) while everything else in this API is plural; treated that as a typo and used the existing plural `/registrations/{registration_id}` resource (same one `registration_get` already lives on) rather than build a second, inconsistent resource tree for one endpoint.
- **Endpoint paths didn't literally match the spec.** `POST /events/{event_id}/register` and `GET /registrations/lookup?email=` are more RESTful than the spec's flat `POST /register` and `GET /registrations/{email}`, but don't match them character-for-character. Added literal aliases rather than replacing the originals (both frontends depend on the originals): `POST /register` reuses `registration_create`, with `event_id` read from the body when there's no `{event_id}` path segment. `GET /registrations/{email}` reuses the *existing* `registration_get` resource (`/registrations/{registration_id}`) instead of a new one, because API Gateway can't host two different single-segment path parameters at the same position — `{registration_id}` and `{email}` would collide. `registration_get` now checks whether the path segment contains `@`: if so it queries the `email-index` GSI and returns `{registrations, count}` (every registration for that email, across events); if not, it's the original single-registration-by-ID lookup, unchanged. This means the same URL shape returns two different response shapes depending on what's in it — an unusual choice, made deliberately to satisfy the literal spec path without breaking the existing ID-based lookup `public-portal`'s ticket page already depends on.
- **IAM was not least-privilege.** All 16 Lambdas used to share one IAM role with one policy granting full CRUD on every DynamoDB table, `sns:Publish`, and `s3:PutObject` to every function regardless of need. `infrastructure/modules/lambda/main.tf` now generates one role and one inline policy per function from a `local.function_table_access` map, so e.g. `event_get` can only `GetItem` on the events table, `speaker_list` can only `Scan` the speakers table, and only `registration_create` has `sns:Publish` / only `image_upload_url` has `s3:PutObject`. `xray:PutTraceSegments` stays granted to everyone (a monitoring permission, not a sensitive one).
- **The CloudWatch alarm was error *count*, not error *rate*.** The spec asks for an alarm "if error rate exceeds 5%" — a percentage of invocations, not a fixed number. The old alarm fired on raw `Errors` sum ≥ 5 over 5 minutes, which means something very different at 10 invocations vs 10,000. `infrastructure/modules/cloudwatch/main.tf`'s `aws_cloudwatch_metric_alarm.lambda_errors` now uses three `metric_query` blocks (`errors`, `invocations`, and a math expression `IF(invocations > 0, (errors / invocations) * 100, 0)`) and alarms at ≥ 5% error rate, per function.
- **SNS confirmations published to a topic nobody was subscribed to.** `registration_create` always called `sns.publish()`, but the `event-registrations` topic had zero subscribers, so every "confirmation" silently went nowhere. Added `aws_sns_topic_subscription.registration_email` in `infrastructure/modules/sns/main.tf`, subscribing the same operator email used for CloudWatch alerts. This is a real, if imperfect, fix: SNS can't dynamically address a topic to whoever just registered, so the operator receives every confirmation rather than each attendee receiving their own — genuine per-attendee delivery would need AWS SES, a materially bigger addition than what the spec's "(Optional) SNS" line implies.
- **CI/CD existed in code but had never actually run.** `.github/workflows/deploy.yml` was already correct (test job runs `pytest`, deploy job runs `terraform apply`, gated to `main`) but the repo had no `git remote` — it had never been pushed to GitHub, so there was no real CI history and no branching strategy in practice (everything happened directly on local `main`). Pushed to `github.com/Aliu2211/event-cloud` (public); the `test` job now runs and passes for real on every push. The `deploy` job intentionally fails until `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `TF_STATE_BUCKET` are added as repository secrets — that's a deliberate boundary: this tool doesn't manage a user's AWS credentials as CI secrets on their behalf.

Closing these gaps required destroying and fully redeploying the AWS stack (per-function IAM roles can't be retrofitted onto functions in place without recreating their role bindings, and the Terraform state backend itself had been torn down between sessions). The 39-test `pytest`/moto suite and a live curl-based smoke test (cancel a real registration, hit both literal-alias routes, confirm the scoped IAM roles still let each function do its job) both passed clean on the redeployed stack before any of this was pushed.
