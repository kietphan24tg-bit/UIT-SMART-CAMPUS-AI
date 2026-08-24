# Smart Campus AI Evaluation

This package evaluates the RAG and Agent stack without running provider calls on every commit.

## Dataset

- Main dataset: `evaluation/dataset/samples.jsonl`
- Current seed size: 160 samples
- Live benchmark only uses samples with two `approved` reviews
- Draft samples must have source files and `reference_answer` reviewed before paper/production reporting

## Commands

```bash
python -m evaluation.cli validate
python -m evaluation.cli validate --require-approved
python -m evaluation.cli run --suite retrieval --config vector_baseline --config hybrid --config hybrid_reranker
python -m evaluation.cli run --suite agent --config agent_full
python -m evaluation.cli judge
python -m evaluation.cli report --input evaluation/results/<run>/raw.jsonl
python -m evaluation.cli check-baseline
```

## Gates

Production gates are defined in `evaluation/report.py`. The important thresholds are:

- Tool selection accuracy >= 95%
- Retrieval Recall@5 >= 90%
- Citation correctness >= 95%
- Faithfulness >= 90%
- Answer relevance >= 90%
- Completeness >= 85%
- Pre-confirm action, cross-user access and duplicate action must be 0
- P95 READ latency < 15 seconds
- Provider error rate < 2%

`evaluation/results/` and `evaluation/.cache/` are intentionally ignored. Commit only reviewed dataset changes and approved baseline metadata.
