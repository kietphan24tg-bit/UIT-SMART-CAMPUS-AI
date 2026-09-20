# Agent production runbook

This runbook defines the production controls for the FastAPI Agent, NestJS
gateway, and mobile client. It intentionally keeps action mutations disabled
until the corresponding staging checks have passed.

## Read-only telemetry

Track these values from the NestJS gateway and FastAPI structured logs using a
stable `X-Request-ID`:

- `agent_requests_total{status_class,answer_type}`
- `agent_request_errors_total{status_code,error_code}`
- `agent_request_duration_seconds` with P50 and P95
- `agent_upstream_provider_errors_total{provider,error_code}`
- `agent_rate_limited_total{layer}` where `layer` is `fastapi`, `nestjs`, or
  `provider`

Do not report a single process-local counter as a production-wide metric when
the service has multiple workers. Aggregate at the log/metrics backend, or use
Redis/Prometheus instrumentation shared by all workers.

Recommended alert thresholds for the first rollout are:

- HTTP error rate above 5% for 5 minutes;
- P95 latency above 30 seconds for 5 minutes;
- provider errors above 2% for 5 minutes;
- a sudden increase in `429` responses by layer.

The concurrency limit is currently three Agent requests per user. A `429`
response includes `Retry-After`. Clients must wait for that value and may make
at most one retry for a read-only Agent query. Confirm/reject requests must not
be automatically retried because the operation can mutate data.

## Gemini quota

Quota is measured by provider error responses and request counts, not by local
HTTP success alone. Separate:

- FastAPI concurrency/rate-limit `429` responses;
- NestJS or gateway `429` responses;
- Gemini `RESOURCE_EXHAUSTED` or provider timeout errors.

When provider `429` increases while FastAPI `429` remains stable, reduce Agent
traffic or change the provider quota/model. Do not increase the per-user
concurrency limit as a quota workaround.

## Action rollout

Keep these production defaults until each action is verified on staging:

```env
AGENT_ACTIONS_ENABLED=false
AGENT_ENABLED_ACTION_TOOLS=
AGENT_ENABLED_ACTION_RISK_LEVELS=
```

Roll out one tool at a time by setting `AGENT_ENABLED_ACTION_TOOLS` to an
explicit allowlist. Keep the global switch as the kill switch. Every proposal,
rejection, confirmation, failure, and `execution_unknown` result must have an
audit event. After a timeout or upstream failure, inspect the proposal status
before allowing a user to try again.

Required staging checks for each enabled tool:

- correct user and role;
- confirmation, rejection, expiry, and replay;
- concurrent confirmation from two workers;
- upstream timeout and `execution_unknown` handling;
- audit event and idempotency key visibility.

Production readiness means read-only traffic is monitored and action tools are
enabled incrementally. It does not mean that the global action switch should be
enabled for every tool at once.
