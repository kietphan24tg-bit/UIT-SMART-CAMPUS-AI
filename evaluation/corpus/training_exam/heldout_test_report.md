# Training Exam Retrieval: Held-out Test Report

Run: `evaluation/results/training_exam_retrieval_20260828_195159`

This report was generated after the retrieval configuration was frozen on the
`dev` split. The held-out `test` split was executed once with the current
vector baseline and hybrid configurations.

## Dataset

- Samples evaluated: 30
- Answerable samples: 28
- Corpus gaps: 2
- Approved dataset validation: passed (`106/106`)
- Corpus: `training_exam`
- Embedding: local `BAAI/bge-m3`, 1024 dimensions

## Results on answerable samples

| Configuration | Recall@5 | Primary heading Recall@5 | Precision@5 | MRR | nDCG@5 | P95 | Provider errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vector baseline | 1.0000 | 1.0000 | 0.7286 | 0.9286 | 0.9254 | 4.13s | 0.00 |
| Hybrid | 1.0000 | 1.0000 | 0.7196 | 0.8571 | 0.8727 | 13.16s | 0.00 |

## Interpretation

Both configurations retrieved the expected source and heading within the top
5 for all 28 answerable test questions. The vector baseline is preferable for
the current deployment candidate: it has the same recall, higher MRR/nDCG and
lower P95 latency than hybrid search in this test run.

Hybrid search remains useful as a research comparison, but it did not improve
the held-out retrieval metrics for this corpus. The two corpus-gap samples are
reported separately and must not be interpreted as retrieval failures until
the missing official sources are added.

## Scope and limitations

This is a retrieval-only evaluation. It does not establish answer
faithfulness, answer relevance, completeness or citation correctness from the
LLM output. Those require a separate answer-quality run using the frozen
configuration and a reviewed judge rubric.
