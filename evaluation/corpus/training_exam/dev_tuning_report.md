# Training Exam Retrieval: Dev Tuning Report

Date: 2026-08-29

This is a development-only diagnostic report. The held-out `test` split was not
used to select the configuration.

## Corpus and validation

- Domain: `training_exam`
- Approved samples: 106
- Dev samples: 76 answerable questions
- Curated documents: 7, with 6 benchmark-eligible sources
- Dataset validation: passed (`106/106` approved)
- Embedding space: local `BAAI/bge-m3`, 1024 dimensions

## Final dev comparison

Results: `evaluation/results/training_exam_retrieval_20260828_174914`.

| Configuration | Recall@5 | Primary-heading Recall@5 | Precision@5 | MRR | nDCG@5 | P95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| vector baseline | 0.9474 | 0.9737 | 0.7807 | 0.9539 | 0.9321 | 3.19s |
| hybrid | 0.9474 | 0.9474 | 0.7116 | 0.9539 | 0.8941 | 5.60s |
| hybrid + reranker K10 | 0.9474 | 0.9737 | 0.6974 | 0.9605 | 0.9438 | 15.84s |

All three configurations had provider error rate `0` in this run.

## Interpretation

The Vietnamese FTS phrase expansion increased dev Recall@5 from the previous
`0.9342` to `0.9474`. Hybrid search did not improve over the vector baseline
on this corpus. The reranker improved nDCG and MRR, but its P95 exceeded the
15-second target and its Precision was lower. Therefore the vector baseline is
the current production candidate, while hybrid+rereanker remains an offline
research candidate until latency is reduced or a lighter reranker is tested.

The primary-heading metric is stricter than document Recall: a result from the
right PDF but the wrong `Điều` is not counted as correct.

## Ablations rejected

Limiting the candidate pool to four chunks per document harmed the difficult
cases and reduced reranker recall. The setting remains five chunks per
document.

## Next controlled step

1. Freeze the vector baseline and current retrieval code as the baseline.
2. Run the same configurations on the held-out `test` split exactly once.
3. Run answer-quality evaluation separately; retrieval metrics alone do not
   establish faithfulness or citation correctness.
