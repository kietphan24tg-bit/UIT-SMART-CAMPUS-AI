# Agent Rate-Limit Diagnosis

---
date: 2026-09-20
scope: production read-only Agent concurrency and ambiguity policy
status: verified
---

## Summary

The `17/20` HTTP 429 responses in the concurrent load run originate from the FastAPI Agent guardrail. They do not originate from Cloudflare, Gemini, or NestJS.

The production behavior exactly matches `AGENT_MAX_CONCURRENT_REQUESTS_PER_USER=3`: three requests acquire a per-user concurrency slot and the remaining requests receive HTTP 429 while those slots are occupied.

## Evidence

- Twenty concurrent requests: 3 HTTP 200, 17 HTTP 429, 0 timeouts.
- Five-worker run with twenty total requests: 3 HTTP 200, 17 HTTP 429, 0 timeouts.
- `query_agent` acquires `agent:concurrency:{user_id}` before invoking the Agent.
- `GuardrailStore.concurrency_slot` rejects values greater than the configured limit.
- Default configuration sets the per-user concurrency limit to 3.
- The rejection detail is `Too many concurrent requests for this user.`

## Decision

Keep the concurrency limit at 3. The Agent performs external LLM calls and 20 simultaneous requests from one account are not a normal interactive workload. Raising the limit without provider and worker capacity evidence would increase quota and timeout risk.

HTTP 429 responses now include `Retry-After`:

- Minute-window rate limit: policy window in seconds.
- Concurrent request limit: Agent total timeout in seconds.

## Ambiguity Policy

- Ask one concise clarification question when a required tool argument is missing.
- Ask when multiple interpretations would select materially different tools.
- Do not ask unnecessarily when a read-only tool can fetch the current authenticated user's data without arguments.
- Missing required arguments return `answer_type=clarification`, create no proposal, and execute no tool.

## Verification

Focused regression suite: `16 passed`.

## Recommendation

Frontend clients should honor `Retry-After`, disable duplicate submits while one request is running, and use exponential backoff only for idempotent read requests.
