# Held-out Answer-quality Ablation

## Setup

- Domain: UIT training and examination regulations (`training_exam`)
- Held-out samples: 30 per configuration (test split, matched 1-to-1 by `sample_id`)
- Generation model: `qwen/qwen3.8-27b` via Groq
- Judge model: `gemini-3.5-flash-lite`
- Retrieval top-k: 6 contexts sent to generation
- Provider and judge errors in merged artifacts: 0

## Mean Metrics Overview

| Configuration | Faithfulness | Relevance | Completeness | Citation correctness | Evaluation wall-time mean |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vector baseline | 99.33% | 100.00% | 99.00% | 99.67% | 17.41s |
| Hybrid | 97.67% | 98.33% | 97.33% | 98.00% | 25.67s |
| Hybrid + BGE reranker K10 | 98.17% | 99.67% | 96.67% | 98.67% | 26.69s |

## Paired Statistical Comparisons (vs. Vector Baseline)

Matched 1-to-1 by `sample_id` ($n=30$). Candidate-minus-baseline mean difference ($\Delta$), deterministic 95% paired bootstrap CI (seed 42, 10,000 resamples), and deterministic Monte Carlo paired sign-flip/permutation estimate p-value (seed 42, 10,000 resamples):

### 1. Hybrid vs. Vector Baseline

| Metric | Baseline Mean | Candidate Mean | Mean Diff ($\Delta$) | 95% Bootstrap CI | Paired p-value | Significant ($\alpha=0.05$) |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| Faithfulness | 0.9933 | 0.9767 | -0.0167 | [-0.0417, +0.0083] | 0.2010 | No |
| Answer Relevance | 1.0000 | 0.9833 | -0.0167 | [-0.0417, +0.0083] | 0.2010 | No |
| Completeness | 0.9900 | 0.9733 | -0.0167 | [-0.0467, +0.0133] | 0.2970 | No |
| Citation Correctness | 0.9967 | 0.9800 | -0.0167 | [-0.0417, +0.0083] | 0.2010 | No |

### 2. Hybrid + Reranker K10 vs. Vector Baseline

| Metric | Baseline Mean | Candidate Mean | Mean Diff ($\Delta$) | 95% Bootstrap CI | Paired p-value | Significant ($\alpha=0.05$) |
| --- | ---: | ---: | ---: | ---: | ---: | :---: |
| Faithfulness | 0.9933 | 0.9817 | -0.0117 | [-0.0333, +0.0100] | 0.3230 | No |
| Answer Relevance | 1.0000 | 0.9967 | -0.0033 | [-0.0100, +0.0000] | 1.0000 | No |
| Completeness | 0.9900 | 0.9667 | -0.0233 | [-0.0633, +0.0167] | 0.2370 | No |
| Citation Correctness | 0.9967 | 0.9867 | -0.0100 | [-0.0300, +0.0100] | 0.3230 | No |

## Sample Size Limitations ($n=30$)

- The evaluation is conducted on $n=30$ held-out test samples.
- Small sample size $n=30$ provides diagnostic feedback on this domain but limits statistical power to detect small effect sizes.
- As shown by the deterministic Monte Carlo paired sign-flip/permutation estimate p-values ($p > 0.05$ across all metrics), score differences between configurations are **not statistically significant** at the $\alpha = 0.05$ level.
- No claim of statistically significant superiority or inferiority can be made based on this sample size.

## Latency Semantics

- **Evaluation Wall Time**: Includes retrieval, answer generation, and judge scoring calls (mean: 17.41s vector, 25.67s hybrid, 26.69s reranker).
- **Production Path RAG Latency**: Tracked separately via `latency_seconds` / `rag_latency_seconds` and does not include judge execution time.
- **LLM Generation Latency**: Instrumentally measured via `TimedChatClient` wrapper around the generation client.

## Interpretation

`vector_baseline` remains the selected configuration for deployment on this seven-document domain. Additional hybrid retrieval and local cross-encoder reranking do not yield measurable quality improvements and incur higher evaluation wall time and retrieval overhead.

## Artifacts

- Combined comparison & offline analysis: `evaluation/results/training_exam_answer_ablation_complete/`
- Vector baseline: `evaluation/results/training_exam_answer_heldout_cloud_complete/`
- Hybrid: `evaluation/results/training_exam_answer_hybrid_cloud_complete/`
- Reranker K10: `evaluation/results/training_exam_answer_20260829_143555/`
