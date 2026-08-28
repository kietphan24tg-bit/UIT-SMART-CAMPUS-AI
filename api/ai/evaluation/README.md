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
python -m evaluation.cli answer-eval
python -m evaluation.cli report --input evaluation/results/<run>/raw.jsonl
```

Retrieval runs measure Recall@5, Precision@5, MRR, nDCG@5, latency and provider errors. Answer evaluation additionally uses a judge model for faithfulness, relevance, completeness and citation correctness.
