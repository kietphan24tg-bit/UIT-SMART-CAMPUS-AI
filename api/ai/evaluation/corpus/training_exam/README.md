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

The current source catalog contains OCR/extraction errors in some document numbers and dates. The
authority matrix deliberately records the filename-derived candidate metadata separately from the
verification status; it must not be treated as proof that a document is currently effective.

## Next curation step

Verify every record in `authority_matrix.json`, then set the final `status` and add exact article-level
relations. Only documents with verified scope/status should be used to approve answerable test samples.
