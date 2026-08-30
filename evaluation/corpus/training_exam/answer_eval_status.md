# Answer Evaluation Status

The held-out answer-quality evaluation and paired statistical analysis are complete.

- Dataset split: `test`
- Samples per configuration: 30 (matched 1-to-1 by `sample_id`)
- Generation model: `qwen/qwen3.8-27b` via Groq
- Judge model: `gemini-3.5-flash-lite`
- Fully scored configurations:
  - `vector_baseline`: 30/30
  - `hybrid`: 30/30
  - `hybrid_reranker_k10`: 30/30
- Generation errors in the merged artifacts: 0
- Judge errors in the merged artifacts: 0

The authoritative combined artifact directory is:

`evaluation/results/training_exam_answer_ablation_complete/`

Generated offline analysis artifacts:
- `paired_analysis.json`: Candidate-minus-baseline mean differences, 95% bootstrap CIs (seed 42, 10,000 resamples), and deterministic Monte Carlo paired sign-flip/permutation estimate p-values (seed 42, 10,000 resamples).
- `sample_deltas.csv`: Per-sample metric deltas for error analysis.
- `offline_analysis.md`: Detailed error analysis, regressions, improvements, ties, and worst sample lists.

Statistical note on sample size ($n=30$):
- Differences between configurations are not statistically significant ($p > 0.05$ across all metrics).
- $n=30$ provides diagnostic insights for this domain split but has limited power for subtle effect sizes.

Latency instrumentation semantics:
- `latency_seconds` / `rag_latency_seconds`: Production RAG path latency (retrieval + generation). No longer silently includes judge call time.
- `llm_latency_seconds`: Measured via `TimedChatClient` wrapper.
- `judge_latency_seconds`: Judge scoring time.
- `eval_wall_time_seconds`: Total evaluation step wall time.
