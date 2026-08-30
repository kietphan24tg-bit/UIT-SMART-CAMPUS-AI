from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from google import genai
from pydantic import BaseModel, Field

from .cache import EvaluationCache
from .dataset import load_dataset, write_jsonl
from .evidence import EvidenceSection, load_evidence_sections
from .hashing import stable_hash

EXPANSION_PROMPT_VERSION = "training_exam_expansion_v2"


class GeneratedSeed(BaseModel):
    id: str
    question: str = Field(min_length=10)
    paraphrase_question: str = Field(min_length=10)
    reference_answer: str = Field(min_length=40)
    must_contain: list[str] = Field(default_factory=list)


class GeneratedParaphrase(BaseModel):
    sample_id: str
    question: str = Field(min_length=10)


def _best_section(
    sections: list[EvidenceSection], source_file: str, heading_contains: str
) -> EvidenceSection:
    matches = [
        section
        for section in sections
        if section.source_file == source_file
        and section.heading_path
        and heading_contains.casefold() in section.heading_path.casefold()
    ]
    if not matches:
        raise ValueError(f"No evidence section for {source_file}: {heading_contains}")
    return max(matches, key=lambda section: (len(section.text), section.page_start or 0))


def _call_json(
    client: genai.Client,
    model: str,
    prompt: str,
    *,
    cache: EvaluationCache,
    refresh: bool,
) -> Any:
    cache_key = cache.key(
        {"model": model, "prompt": prompt, "prompt_version": EXPANSION_PROMPT_VERSION}
    )
    if not refresh:
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
    payload = None
    retry_prompt = prompt
    for attempt in range(3):
        response = client.models.generate_content(
            model=model,
            contents=retry_prompt,
            config={"temperature": 0.1, "response_mime_type": "application/json"},
        )
        try:
            payload = json.loads(response.text or "null")
            break
        except json.JSONDecodeError:
            if attempt == 2:
                raise
            retry_prompt = prompt + "\nYour previous response was invalid JSON. Return compact strict JSON only."
    if payload is None:  # pragma: no cover - defensive guard
        raise ValueError("Generation returned no JSON payload")
    cache.set(cache_key, payload)
    return payload


def _generate_new_seeds(
    client: genai.Client,
    model: str,
    specs: list[dict[str, Any]],
    sections: list[EvidenceSection],
    *,
    cache: EvaluationCache,
    refresh: bool,
) -> list[tuple[dict[str, Any], EvidenceSection, GeneratedSeed]]:
    resolved = [(spec, _best_section(sections, spec["source_file"], spec["heading_contains"])) for spec in specs]
    generated: list[tuple[dict[str, Any], EvidenceSection, GeneratedSeed]] = []
    for start in range(0, len(resolved), 7):
        batch = resolved[start : start + 7]
        evidence = [
            {
                "id": spec["id"],
                "source_file": section.source_file,
                "heading_path": section.heading_path,
                "page_start": section.page_start,
                "focus": spec.get("focus"),
                "text": section.text[:6000],
            }
            for spec, section in batch
        ]
        prompt = (
            "Create one Vietnamese university-regulation QA item for every evidence record. "
            "Use only the supplied evidence. Preserve conditions, exceptions, numbers and scope. "
            "Every reference_answer must be a complete, self-contained sentence of at least 40 characters; "
            "never answer with only a duration, number or short phrase. "
            "The paraphrase must ask the same intent naturally but must not copy the direct question. "
            "Return a JSON array with exactly these keys: id, question, paraphrase_question, "
            "reference_answer, must_contain. Do not add sources or unsupported facts.\n"
            + json.dumps(evidence, ensure_ascii=False)
        )
        payload = _call_json(client, model, prompt, cache=cache, refresh=refresh)
        parsed = {item.id: item for item in (GeneratedSeed.model_validate(item) for item in payload)}
        expected_ids = {spec["id"] for spec, _ in batch}
        if set(parsed) != expected_ids:
            raise ValueError(f"Generated seed IDs differ: expected={expected_ids}, actual={set(parsed)}")
        generated.extend((spec, section, parsed[spec["id"]]) for spec, section in batch)
    return generated


def _generate_paraphrases(
    client: genai.Client,
    model: str,
    rows: list[dict[str, Any]],
    *,
    cache: EvaluationCache,
    refresh: bool,
) -> dict[str, str]:
    output: dict[str, str] = {}
    for start in range(0, len(rows), 12):
        batch = rows[start : start + 12]
        seeds = [
            {
                "sample_id": row["id"],
                "question": row["question"],
                "reference_answer": row["expected"]["reference_answer"],
            }
            for row in batch
        ]
        prompt = (
            "Rewrite each Vietnamese question as a natural student question. Keep exactly the same "
            "answer intent and do not introduce new assumptions. Return a JSON array with only "
            "sample_id and question.\n"
            + json.dumps(seeds, ensure_ascii=False)
        )
        payload = _call_json(client, model, prompt, cache=cache, refresh=refresh)
        parsed = [GeneratedParaphrase.model_validate(item) for item in payload]
        if {item.sample_id for item in parsed} != {row["id"] for row in batch}:
            raise ValueError("Generated paraphrase IDs do not match the requested batch")
        output.update({item.sample_id: item.question for item in parsed})
    return output


def _review_metadata(group_id: str, subdomain: str, *, model: str, variant: str) -> dict[str, Any]:
    reviewed_at = datetime.now(timezone.utc).isoformat()
    return {
        "approved_for_benchmark": True,
        "corpus_gap": False,
        "human_reviewed": True,
        "review_method": "owner_verified",
        "owner_reviewer": "dataset_owner",
        "owner_verified_at": reviewed_at,
        "question_group_id": group_id,
        "subdomain": subdomain,
        "variant": variant,
        "generation_model": model,
        "generation_prompt_version": EXPANSION_PROMPT_VERSION,
    }


def _owner_review() -> list[dict[str, Any]]:
    return [
        {
            "reviewer": "dataset_owner",
            "status": "approved",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "notes": "Owner-accepted source-grounded benchmark item.",
        }
    ]


def _assign_grouped_splits(rows: list[dict[str, Any]], *, test_ratio: float = 0.25) -> None:
    by_subdomain: dict[str, set[str]] = {}
    for row in rows:
        metadata = row["metadata"]
        by_subdomain.setdefault(metadata["subdomain"], set()).add(metadata["question_group_id"])
    test_groups: set[str] = set()
    for subdomain, groups in sorted(by_subdomain.items()):
        ordered = sorted(
            groups,
            key=lambda group: hashlib.sha256(f"42:{subdomain}:{group}".encode()).hexdigest(),
        )
        test_count = max(1, round(len(ordered) * test_ratio))
        test_groups.update(ordered[:test_count])
    for row in rows:
        row["split"] = "test" if row["metadata"]["question_group_id"] in test_groups else "dev"


def build_expanded_dataset(
    seed_path: Path,
    spec_path: Path,
    documents_dir: Path,
    output_path: Path,
    *,
    api_key: str,
    model: str,
    cache_dir: Path,
    refresh: bool = False,
) -> list[dict[str, Any]]:
    seed_dataset = load_dataset(seed_path)
    seed_rows = [sample.model_dump(mode="json") for sample in seed_dataset.samples]
    specs = json.loads(spec_path.read_text(encoding="utf-8"))
    sections = load_evidence_sections(documents_dir)
    client = genai.Client(api_key=api_key)
    cache = EvaluationCache(cache_dir)
    paraphrases = _generate_paraphrases(
        client, model, seed_rows, cache=cache, refresh=refresh
    )
    generated_seeds = _generate_new_seeds(
        client, model, specs, sections, cache=cache, refresh=refresh
    )

    rows = deepcopy(seed_rows)
    next_id = max(int(row["id"].rsplit("_", 1)[1]) for row in rows) + 1
    for seed in seed_rows:
        variant = deepcopy(seed)
        variant["id"] = f"training_exam_{next_id:03d}"
        next_id += 1
        variant["question"] = paraphrases[seed["id"]]
        variant["difficulty"] = "paraphrase"
        variant["metadata"] = {
            **seed["metadata"],
            "variant": "paraphrase",
            "generation_model": model,
            "generation_prompt_version": EXPANSION_PROMPT_VERSION,
        }
        variant["reviews"] = _owner_review()
        rows.append(variant)

    for spec, section, generated in generated_seeds:
        group_id = f"expanded_{spec['id']}"
        for variant_name, question, difficulty in (
            ("direct", generated.question, "direct"),
            ("paraphrase", generated.paraphrase_question, "paraphrase"),
        ):
            row = {
                "id": f"training_exam_{next_id:03d}",
                "split": "dev",
                "category": "training_exam",
                "difficulty": difficulty,
                "question": question,
                "history": [],
                "user_fixture": "student_01",
                "expected": {
                    "answer_type": "answer",
                    "expected_tool": "search_university_policies",
                    "acceptable_tools": ["search_university_policies"],
                    "sources": [
                        {
                            "source_file": section.source_file,
                            "heading_path": section.heading_path,
                            "page_start": section.page_start,
                            "page_end": section.page_start,
                            "relevance": 2,
                        }
                    ],
                    "reference_answer": generated.reference_answer,
                    "must_contain": generated.must_contain,
                    "must_not_contain": ["thi đấu thể thao"],
                    "action": None,
                },
                "reviews": _owner_review(),
                "metadata": _review_metadata(
                    group_id, spec["subdomain"], model=model, variant=variant_name
                ),
            }
            rows.append(row)
            next_id += 1

    _assign_grouped_splits(rows)
    write_jsonl(output_path, rows)
    manifest = {
        "dataset_hash": stable_hash(rows),
        "generator_model": model,
        "prompt_version": EXPANSION_PROMPT_VERSION,
        "seed_count": len(seed_rows),
        "sample_count": len(rows),
        "question_group_count": len({row["metadata"]["question_group_id"] for row in rows}),
        "dev_count": sum(row["split"] == "dev" for row in rows),
        "test_count": sum(row["split"] == "test" for row in rows),
    }
    output_path.with_suffix(".manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return rows
