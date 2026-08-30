# Training and Exam Corpus

This is the curated research corpus for UIT regular undergraduate academic-regulation QA.

The corpus keeps curated copies of the existing normalized Markdown under `documents/`. The source
text is preserved; only research metadata and the corpus mapping are added. The original normalized
files under `D:/Workspace/UIT-document-normalized` are not modified, so production documents and
research curation remain separate.

## Scope

- Credit-based training regulation.
- Centralized and computer-based examination rules.
- Examination and grade management procedure.
- Academic-status processing.

## Authority model

- `authority_level=3`: signed regulation, decision or official primary procedure.
- `authority_level=2`: operational procedure or official supporting guidance.
- `status=needs_verification`: safe default until the signed document and official UIT page are checked.
- `benchmark_eligible=false`: document remains archived in the corpus but is excluded from retrieval experiments and ground truth.

The current source catalog contains OCR/extraction errors in some document numbers and dates. The
authority matrix deliberately records the filename-derived candidate metadata separately from the
verification status; it must not be treated as proof that a document is currently effective.

## Benchmark policy

Only benchmark-eligible documents with resolved authority may be retrieved during experiments. The
2013 operational procedure remains available for provenance but is excluded until its current status is
verified. Ground truth uses owner verification, records a source-anchored audit trail, and groups
paraphrases under one `question_group_id` to prevent dev/test leakage.

## Evaluation dataset

- `samples.jsonl` is the canonical benchmark: 106 source-grounded samples in 46 question
  groups, split into 76 `dev` and 30 held-out `test` samples.
- Paraphrases from the same question group always stay in the same split.
- Two samples are deliberate corpus-gap/fallback cases for an unverified 2025 decision; they
  are retained for fallback evaluation and do not count as source-recall failures.
- Generated variants retain `generation_model` and `generation_prompt_version` metadata. The
  dataset owner performed the source-anchored approval audit; this is not an independent
  inter-annotator agreement study.
- `expansion_spec.json` records the source-anchored intents used to expand the original seed
  set. Future changes should create a new dataset version rather than silently modifying this
  benchmark.
