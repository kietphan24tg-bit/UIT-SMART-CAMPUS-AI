# Agent Validation Follow-up

Date: 2026-09-19
Environment: production read-only (`https://uitsmartcampus.id.vn`)

## 1. Semantic checks

Each case used the same authenticated role for the Agent request and the NestJS oracle request. Both HTTP statuses and the selected tool were recorded. The value-match column is a conservative string-presence heuristic over scalar oracle leaves; it is not a complete semantic equivalence proof because the Agent is allowed to summarize lists.

| Role / case | Agent | Oracle | Selected tool | Oracle scalar leaves | Values visible in answer |
|---|---:|---:|---|---:|---:|
| Student / schedule | 200 | 200 | `get_current_schedule` | 45 | 29 |
| Student / grades | 200 | 200 | `get_current_grades` | 42 | 13 |
| Student / attendance | 200 | 200 | `get_my_attendance_history` | 39 | 11 |
| Lecturer / schedule | 200 | 200 | `get_current_schedule` | 56 | 38 |
| Lecturer / grades | 200 | 200 | `get_lecturer_grade_sections` | 90 | 34 |
| Lecturer / attendance | 200 | 200 | `get_lecturer_attendance_sections`, `get_lecturer_attendance_history` | 66 | 10 |
| Admin / schedule | 200 | 200 | `get_current_schedule` | 8 | 2 |
| Admin / canteen | 200 | 200 | `get_canteen_catalog` | 78 | 0 |
| Admin / buildings | 200 | 200 | `list_buildings` | 21 | 16 |

Interpretation: all selected tools and oracle routes were reachable. Low string-match counts do not automatically mean wrong answers; long payloads are summarized and can contain IDs or metadata that are intentionally omitted. The next stronger check should compare structured tool output against an expected schema and selected fields, not raw answer text.

## 2. Ambiguous questions

Five ambiguous/out-of-scope prompts were run as student:

| Prompt category | Status | Observed behavior |
|---|---:|---|
| Generic room question | 200 | Chose current schedule |
| Vague schedule question | 200 | Chose current schedule |
| Missing attendance parameters | 200 | Chose attendance history |
| Generic library information | 200 | `fallback/no_evidence` |
| Generic canteen information | 200 | `fallback/outside_corpus` |

The first three are not necessarily failures because the tools accept zero arguments, but they should be reviewed against the intended UX. If the requirement is to ask a clarification question whenever a date, semester, class, or room is absent, the routing policy needs an explicit ambiguity gate.

## 3. Cross-role leakage probe

Scalar leaf intersection between authenticated role payloads was checked without printing values. Student/lecturer had no intersection; student/admin and admin/student had two shared scalar values. These are not sufficient evidence of leakage because shared catalog/status values can be legitimate. No role's personal payload was sent to another role's Agent request. A stronger check requires seeded, role-unique fixture identifiers and assertions that those identifiers never occur in another role's response.

## 4. Repeated read-only stability

The regulation query was run three times with the student account:

| Run | Status | Latency | Answer type | Citations |
|---:|---:|---:|---|---:|
| 1 | 200 | 14.87 s | answer | 2 |
| 2 | 200 | 18.51 s | answer | 2 |
| 3 | 200 | 15.22 s | answer | 2 |

The three-run sample had no timeout or provider error. It is too small to claim production capacity; the earlier 24-case matrix remains the broader availability sample.

## 5. Structured payload and role-unique fixtures

Added a local contract fixture with distinct IDs and course codes for student, lecturer, and admin. The same read tool is invoked with each role's token; the test asserts the complete structured payload is preserved and that each result contains only its own fixture user ID.

## 6. Error and action-safety fixtures

Targeted local tests cover NestJS `401/403/404/409/422/429/500`, timeout handling, token non-leakage, replay rejection, expiry rejection, wrong-user rejection, and timeout state `execution_unknown`.

Result:

```text
26 passed in the focused Agent suite.
```

The focused suite includes a concurrent-confirm fixture: two threads confirm the same proposal and exactly one claims/executes it; the other receives a conflict.

An additional real-PostgreSQL integration test now creates an isolated temporary schema in the configured database. Two independent database connections race to claim the same proposal and exactly one succeeds. Proposal creation, reject, wrong-user rejection, confirm, replay prevention, result persistence, and schema cleanup all pass. No NestJS mutation endpoint is called.

## 7. Six-run read-only repeat

The regulation query was run six times after the initial three-run sample:

```text
success: 6/6
latencies: 15065.97, 15321.14, 15347.40, 15530.47, 15612.75, 17928.16 ms
average: 15800.98 ms
```

All six responses were `200`, selected `search_university_policies`, and returned an answer with citations. This is a stability sample, not a capacity/load benchmark.

## 8. Concurrent read-only load

Twenty identical schedule queries were sent concurrently in two bounded runs:

| Workers | Completed | HTTP 200 | HTTP 429 | Timeout |
|---:|---:|---:|---:|---:|
| 20 | 20 | 3 | 17 | 0 |
| 5 | 20 | 3 | 17 | 0 |

The limiting behavior was `429 Too Many Requests`, not a timeout or `502`. Root-cause inspection confirms that FastAPI's per-user concurrency guard emits these responses: `AGENT_MAX_CONCURRENT_REQUESTS_PER_USER` is 3, matching the three successful concurrent requests exactly. This is not a Cloudflare, Gemini, or NestJS error. The limit remains unchanged, and rejected requests now receive a `Retry-After` header.

## Remaining gaps

1. Add seeded role-unique IDs and compare structured fields for exact oracle validation.
2. Decide and encode the ambiguity policy for missing date/semester/class/room parameters.
3. Provide a staging NestJS business-data environment only if real mutation side effects must be tested end to end.
