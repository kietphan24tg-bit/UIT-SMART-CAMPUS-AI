# Agent Action PostgreSQL Test Report

---
date: 2026-09-20
scope: isolated action proposal lifecycle on real PostgreSQL
environment: existing database, temporary schema
---

## Summary

Real PostgreSQL action-safety integration completed without creating a separate database. The test created a unique schema prefixed `agent_action_test_`, exercised proposal state transitions and concurrent claims, then dropped and verified removal of that exact schema.

No NestJS mutation endpoint was called.

## Test Results

| Suite | Passed | Failed | Duration |
|---|---:|---:|---:|
| Real PostgreSQL proposal integration | 1 | 0 | 37.79 s |
| Agent action, NestJS client, and tool regression | 27 | 0 | 37.66 s |

## Verified Behavior

- Proposal creation persists in the isolated schema.
- Reject changes only a pending proposal to `rejected`.
- Wrong-user claim returns no proposal and leaves it pending.
- Confirm atomically changes `pending` to `executing`.
- Executed proposal cannot be claimed again.
- Two independent PostgreSQL connections race for the same proposal; exactly one wins.
- Temporary schema removal is verified with `to_regnamespace`.
- Existing fixture coverage still validates timeout, replay, expiry, authorization, and NestJS error mapping.

## Safety

- Schema name is generated with a fixed `agent_action_test_` prefix and random suffix.
- Cleanup targets only the generated schema and runs in `finally`.
- Production Agent schema and NestJS business tables are not used.
- Action execution against production NestJS remains disabled.

## Remaining Question

This validates PostgreSQL proposal coordination and mocked action execution. It does not validate side effects of a real NestJS mutation endpoint; that still requires a staging business-data environment if end-to-end mutation evidence is required.
