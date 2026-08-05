# Walkthrough: Event Registration and Ticketing System

**getINNOtized x Azubi Africa Capstone | Aliu Tijani**

This document is a presentation script: the problem this system solves, the engineering decisions and challenges behind it, and a step-by-step demo. Pair it with `README.md` for the architecture diagram and full API reference.

## The problem

Manual event registration through Microsoft Forms and Excel breaks down as soon as an event has real scale or more than one organizer touching it: no live capacity tracking, no automatic confirmation, no way to look up "everyone who registered with this email across every event" without opening and cross-referencing spreadsheets by hand, and no audit trail when a registration needs to be cancelled. This system replaces that spreadsheet workflow with a REST API backed entirely by managed AWS services, so capacity, confirmations, and cancellations are all handled by the platform instead of a person.

## Architecture, and why each piece was chosen

![Architecture diagram](architecture.png)

- **API Gateway + Lambda, not a container or a monolith.** Registration traffic is bursty (spikes around an event announcement, near-silent otherwise) and the whole point of the Free Tier constraint is to pay for compute only when a request actually happens. A REST API on API Gateway routing to one Lambda per operation does exactly that, with the added benefit that each function can be given its own IAM role.
- **DynamoDB, not RDS.** The access patterns here are all key-based (get an event by ID, get a registration by ID, list registrations for one event) with one cross-cutting lookup (find registrations by email, across events) — a textbook fit for a single-table-per-entity DynamoDB design with a Global Secondary Index for the one non-key access pattern, rather than paying for an always-on relational instance to run a handful of simple queries.
- **Cognito, not a custom auth system.** Organizer-only endpoints (create an event, view all registrations, upload an image) need real authentication; Cognito issues JWTs that API Gateway's built-in authorizer validates natively, with zero custom auth code to write or secure.
- **Terraform, not console clicks.** Every resource in this system — tables, functions, routes, alarms, budgets — is defined as code and reproducible with `terraform apply`. Nothing was created by hand in the AWS console.

## Engineering decisions and challenges

A few of these came from things that genuinely broke during development, not just design choices made on paper:

- **DynamoDB rejects empty strings as GSI key values.** `sessions` has a `speaker-index` GSI keyed on `speaker_id`, but not every session has a speaker yet. Defaulting the field to `""` for speakerless sessions broke every write with `AttributeValue for a key attribute cannot contain an empty string value` — the fix was to omit the attribute entirely when there's no speaker, rather than writing an empty placeholder.
- **DynamoDB numbers come back as `Decimal`, and `json.dumps` doesn't know what to do with them.** Every handler uses a small custom `_DecimalEncoder` that converts whole numbers to `int` and fractional ones to `float` before serializing a response.
- **API Gateway won't auto-answer CORS preflight on a Lambda proxy integration.** Every resource that a browser calls with a JSON body needs an explicit `OPTIONS` method backed by a `MOCK` integration returning the right `Access-Control-Allow-*` headers — Lambda proxy integrations only handle the method they're bound to, not `OPTIONS`.
- **Two different single-segment path parameters can't share one API Gateway resource.** The spec's literal `GET /registrations/{email}` and the already-shipped `GET /registrations/{registration_id}` collide at the routing level — API Gateway resolves one path-parameter name per position, not two. The resolution: one resource, one handler, and the handler itself decides what it's looking at (an `@` in the path segment means "treat this as an email and return every matching registration," anything else means "treat this as a registration ID").
- **Cognito's app client only allows `USER_PASSWORD_AUTH`, and the auth SDK defaults to SRP.** Login silently failed with "USER_SRP_AUTH is not enabled for the client" until the sign-in call explicitly requested `USER_PASSWORD_AUTH` — caught only by actually trying to log in through a browser, not by any automated test.
- **Least-privilege IAM couldn't be retrofitted onto a live stack in place.** Moving from one shared IAM role to one scoped role per function meant every Lambda needed a new role binding — cheaper and safer to destroy and cleanly redeploy the whole stack than to patch 16 functions' roles individually while traffic could be hitting them.
- **CloudWatch error alarms needed to be a rate, not a count.** An alarm on "5 errors in 5 minutes" means something very different at 10 requests a day versus 10,000. Metric math (`errors ÷ invocations × 100`) turns that into an actual percentage, which is what "alert when the error rate exceeds 5%" requires.

## Demo script

Assumes the stack is deployed (`terraform apply` succeeded) and `$API` is the API Gateway URL from the Terraform output.

**1. Public, unauthenticated flow**
```bash
curl -s "$API/events"                                   # list events, no token needed
curl -s "$API/register" -X POST -d '{...}'               # attempt without event_id -> 400
curl -s "$API/events/{event_id}/register" -X POST -d '{"participant_name":"...","email":"..."}'
curl -s "$API/registrations/{registration_id}"            # look up the ticket just created
curl -s "$API/registrations/{email}"                       # same route, email instead -> list
```

**2. Capacity and duplicate protection**
Register into a 1-capacity event twice with different emails — the second returns 400 ("not available for registration") and the event's `status` flips to `full`. Register the same email twice for the same event — the second returns 409.

**3. Cancellation**
```bash
curl -s -X DELETE "$API/registrations/{registration_id}"   # cancels, frees the capacity slot
curl -s "$API/events/{event_id}"                            # registered_count is back down, status recalculated
curl -s -X DELETE "$API/registrations/{registration_id}"   # second call -> 400, already cancelled
```

**4. Organizer-only endpoints (auth boundary)**
```bash
curl -s -X POST "$API/events" -d '{...}'                    # no token -> 401
curl -s -X POST "$API/events" -H "Authorization: $TOKEN" -d '{...}'   # with a Cognito token -> 201
```

**5. Monitoring**
Open the CloudWatch console: one log group per function, one error-rate alarm per function (`{function}-error-rate`, alarms at ≥5%). Trigger a couple of 400/404s and show they don't move the alarm (only 5xx-class Lambda errors count toward the `Errors` metric) — then point at the SNS topic subscription that would page on a real spike.

**6. Cost guardrail**
Open AWS Budgets: `event-ticketing-free-tier`, $1/month, alerts at 80% forecasted spend.

**7. CI**
Push a commit, open the Actions tab on GitHub, show the `test` job running the same `pytest` suite live.

## Links

- API: see `terraform output api_url` (redeployed periodically during development, so check current output rather than any URL quoted elsewhere)
- Repo: `https://github.com/Aliu2211/event-cloud`
- Tests: `.venv/bin/pytest tests/ -v` — 39 passing
