# Training and Examination RAG Evaluation

This package evaluates one research domain only: UIT undergraduate training regulations and examination procedures (`training_exam`).

## Structure

- `corpus/training_exam/documents/`: seven normalized official documents used as evidence.
- `corpus/training_exam/manifest.json`: corpus membership and retrieval filters.
- `corpus/training_exam/authority_matrix.json`: authority and validity status of each document.
- `corpus/training_exam/samples.jsonl`: the single 30-question benchmark dataset.
- `corpus/training_exam/qa_ground_truth_audit.md`: readable source and reference-answer audit.
- `corpus/training_exam/reports/`: corpus quality reports.
- `results/`: generated benchmark runs; ignored by Git.

The dataset currently has two AI audit records per sample and explicitly sets `human_reviewed=false`. These records are useful for engineering diagnostics, but they must not be described as two independent human reviews in a paper.

## Commands

```bash
python -m evaluation.cli validate --strict-ground-truth --require-approved
python -m evaluation.cli corpus-validate
python -m evaluation.cli run --config vector_baseline --config hybrid --config hybrid_reranker
python -m evaluation.cli answer-eval --retrieval-config hybrid_reranker_k10
python -m evaluation.cli answer-eval --retrieval-config hybrid_reranker_k10 --resume evaluation/results/training_exam_answer_partial/raw.jsonl
python -m evaluation.cli report --input evaluation/results/<run>/raw.jsonl
python -m evaluation.cli analyze --input evaluation/results/training_exam_answer_ablation_complete/raw.jsonl
```

## Statistical Methodology & Latency Instrumentation

- **Metrics**: Answer quality is scored on `faithfulness`, `answer_relevance`, `completeness`, and `citation_correctness`.
- **Paired Comparisons**: Candidate configurations (`hybrid`, `hybrid_reranker_k10`) are matched by `sample_id` against `vector_baseline`. Reports candidate-minus-baseline mean differences, deterministic 95% paired bootstrap CIs (seed 42, 10,000 resamples), and a deterministic Monte Carlo paired sign-flip/permutation estimate p-value (seed 42, 10,000 resamples). Missing or duplicate sample IDs fail validation (fail closed).
- **Provider Error Separation**: Infrastructure failures (e.g. LLM timeouts, network dropouts) are tracked separately via `provider_error` and `provider_error_rate` metrics. Quality metrics evaluate valid model outputs to prevent infrastructure glitches from distorting answer quality scores.
- **Sample Size Limitation ($n=30$)**: The held-out test split consists of 30 samples. While providing clear diagnostic feedback on this domain, $n=30$ limits statistical power; reported p-values must be interpreted alongside confidence intervals.
- **Latency Instrumentation**: `latency_seconds` explicitly tracks production RAG path latency (retrieval + LLM generation, excluding judge time) to preserve backward-compatible semantics. Separate fields track `rag_latency_seconds`, `llm_latency_seconds` (via timed ChatClient wrapper), `judge_latency_seconds`, and total `eval_wall_time_seconds`. Full latency distributions (p50, p95, p99, mean) are reported for all RAG and evaluation stages.
- **Deterministic Resume**: Running `answer-eval --resume <raw.jsonl>` reuses completed, valid samples while executing only missing or errored samples, ensuring reproducible benchmark completion without wasting LLM quota.
