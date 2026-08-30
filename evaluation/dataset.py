from __future__ import annotations

import json
from pathlib import Path

from .schemas import EvaluationDataset, EvaluationSample, ReviewStatus

PACKAGE_DIR = Path(__file__).resolve().parent
CORPUS_DIR = PACKAGE_DIR / "corpus" / "training_exam"
DEFAULT_DATASET_PATH = CORPUS_DIR / "samples.jsonl"
DEFAULT_VERSION = "training_exam_eval_v2"
EXPECTED_CATEGORY = "training_exam"
EXPECTED_TOTAL = 106


class DatasetValidationError(ValueError):
    pass


def load_dataset(path: Path = DEFAULT_DATASET_PATH) -> EvaluationDataset:
    samples: list[EvaluationSample] = []
    with path.open(encoding="utf-8") as file:
        for line_no, line in enumerate(file, start=1):
            stripped = line.strip().lstrip("\ufeff")
            if not stripped or stripped.startswith("#"):
                continue
            try:
                samples.append(EvaluationSample.model_validate_json(stripped))
            except Exception as exc:  # pragma: no cover - pydantic gives detailed nested errors
                raise DatasetValidationError(f"{path}:{line_no}: {exc}") from exc
    return EvaluationDataset(version=DEFAULT_VERSION, samples=samples)


def approved_samples(dataset: EvaluationDataset) -> list[EvaluationSample]:
    return dataset.approved_samples()


def dataset_fingerprint(dataset: EvaluationDataset) -> str:
    from .hashing import stable_hash

    payload = {
        "version": dataset.version,
        "samples": [sample.model_dump(mode="json") for sample in dataset.samples],
    }
    return stable_hash(payload)


def validate_dataset(
    dataset: EvaluationDataset,
    *,
    expected_total: int = EXPECTED_TOTAL,
    require_approved: bool = False,
    require_two_approvals: bool | None = None,
    known_sources: set[str] | None = None,
    strict_ground_truth: bool = False,
) -> list[str]:
    errors: list[str] = []
    if len(dataset.samples) != expected_total:
        errors.append(f"Expected {expected_total} samples, found {len(dataset.samples)}.")

    invalid_categories = sorted({sample.category for sample in dataset.samples if sample.category != EXPECTED_CATEGORY})
    if invalid_categories:
        errors.append(
            f"Only category {EXPECTED_CATEGORY!r} is allowed, found: {', '.join(invalid_categories)}."
        )

    scoped_samples = dataset.samples

    group_splits: dict[str, set[str]] = {}
    for sample in scoped_samples:
        group_splits.setdefault(sample.question_group_id, set()).add(sample.split.value)
    leaked_groups = sorted(group for group, splits in group_splits.items() if len(splits) > 1)
    if leaked_groups:
        errors.append(f"Question groups cross dev/test splits: {', '.join(leaked_groups[:10])}.")

    if strict_ground_truth:
        split_counts = {
            split: sum(sample.split.value == split for sample in scoped_samples)
            for split in ("dev", "test")
        }
        if split_counts["dev"] < 60:
            errors.append(f"Final benchmark requires at least 60 dev samples, found {split_counts['dev']}.")
        if split_counts["test"] < 20:
            errors.append(f"Final benchmark requires at least 20 test samples, found {split_counts['test']}.")

    if require_two_approvals is not None:
        require_approved = require_approved or require_two_approvals

    if require_approved:
        missing = [sample.id for sample in scoped_samples if not sample.approved]
        if missing:
            preview = ", ".join(missing[:10])
            suffix = "..." if len(missing) > 10 else ""
            errors.append(f"{len(missing)} samples do not satisfy the declared approval policy: {preview}{suffix}")

    for sample in scoped_samples:
        approved_reviewers = [review.reviewer for review in sample.reviews if review.status is ReviewStatus.APPROVED]
        if len(approved_reviewers) != len(set(approved_reviewers)):
            errors.append(f"{sample.id}: duplicate approved reviewers are not allowed.")

        review_method = str(sample.metadata.get("review_method") or "")
        if review_method == "owner_verified":
            owner = str(sample.metadata.get("owner_reviewer") or "")
            if not sample.metadata.get("human_reviewed"):
                errors.append(f"{sample.id}: owner_verified requires human_reviewed=true.")
            if not owner:
                errors.append(f"{sample.id}: owner_verified requires owner_reviewer.")
            if owner and owner not in approved_reviewers:
                errors.append(f"{sample.id}: owner_reviewer must have an approved review record.")
        elif require_approved:
            errors.append(f"{sample.id}: final benchmark requires review_method='owner_verified'.")

        if not sample.question_group_id.strip():
            errors.append(f"{sample.id}: question_group_id must not be empty.")
        if not sample.subdomain.strip():
            errors.append(f"{sample.id}: subdomain must not be empty.")

        if strict_ground_truth:
            if sample.expected.answer_type == "answer" and not sample.corpus_gap:
                if not sample.expected.sources:
                    errors.append(f"{sample.id}: answer sample must declare at least one source.")
                if not sample.expected.reference_answer.strip():
                    errors.append(f"{sample.id}: answer sample must include a non-empty reference_answer.")
                if sample.expected.sources and max(source.relevance for source in sample.expected.sources) < 2:
                    errors.append(f"{sample.id}: answer sample must include at least one relevance=2 source.")
            if sample.expected.answer_type == "fallback":
                if sample.expected.sources:
                    errors.append(f"{sample.id}: fallback sample must not declare sources.")
                if not sample.expected.reference_answer.strip():
                    errors.append(f"{sample.id}: fallback sample must explain the fallback reason in reference_answer.")
            if sample.corpus_gap and sample.expected.answer_type == "answer" and sample.expected.sources:
                errors.append(f"{sample.id}: corpus_gap samples must not declare sources until evidence exists.")

        if strict_ground_truth and known_sources is not None:
            missing_sources = [
                source.source_file
                for source in sample.expected.sources
                if source.source_file not in known_sources
            ]
            if missing_sources:
                preview = ", ".join(sorted(set(missing_sources))[:5])
                errors.append(f"{sample.id}: source_file not found in source catalog: {preview}.")

    return errors


def write_jsonl(path: Path, records: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
