from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from .schemas import EvaluationDataset, EvaluationSample

PACKAGE_DIR = Path(__file__).resolve().parent
DATASET_DIR = PACKAGE_DIR / "dataset"
DEFAULT_DATASET_PATH = DATASET_DIR / "samples.jsonl"
DEFAULT_VERSION = "uit_smart_campus_eval_v1"

EXPECTED_DISTRIBUTION: dict[str, int] = {
    "training_exam": 30,
    "learning_outcome": 15,
    "tuition_procedure": 20,
    "academic_personal": 20,
    "campus_services": 25,
    "action_confirmation": 25,
    "out_of_scope": 10,
    "security": 15,
}


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
    expected_total: int = 160,
    require_distribution: bool = True,
    require_two_approvals: bool = False,
) -> list[str]:
    errors: list[str] = []
    if len(dataset.samples) != expected_total:
        errors.append(f"Expected {expected_total} samples, found {len(dataset.samples)}.")

    split_counts = Counter(sample.split.value for sample in dataset.samples)
    if split_counts.get("dev", 0) != 112 or split_counts.get("test", 0) != 48:
        errors.append(f"Expected split dev=112/test=48, found {dict(split_counts)}.")

    if require_distribution:
        category_counts = Counter(sample.category for sample in dataset.samples)
        for category, expected in EXPECTED_DISTRIBUTION.items():
            actual = category_counts.get(category, 0)
            if actual != expected:
                errors.append(f"Expected category {category}={expected}, found {actual}.")

    if require_two_approvals:
        missing = [sample.id for sample in dataset.samples if not sample.approved]
        if missing:
            preview = ", ".join(missing[:10])
            suffix = "..." if len(missing) > 10 else ""
            errors.append(f"{len(missing)} samples do not have two approvals: {preview}{suffix}")

    return errors


def write_jsonl(path: Path, records: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as file:
        for record in records:
            file.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
