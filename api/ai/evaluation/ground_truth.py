from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .evidence import EvidenceSection, load_evidence_sections
from .corpus import RESOLVED_AUTHORITY_STATUSES, CorpusManifest
from .dataset import write_jsonl
from .schemas import EvaluationSample


def _best_heading_match(
    sections: list[EvidenceSection],
    source_file: str,
    heading_contains: str | None,
) -> EvidenceSection | None:
    if heading_contains is None:
        return None
    candidates = [
        section
        for section in sections
        if section.source_file == source_file
        and section.heading_path
        and heading_contains.casefold() in section.heading_path.casefold()
    ]
    if not candidates:
        raise ValueError(f"No heading containing {heading_contains!r} in {source_file}")
    # Prefer the requested legal section over a deeper point that inherited its
    # title. Among equal-depth matches, the full body beats a table-of-contents row.
    return min(
        candidates,
        key=lambda section: (
            section.heading_path.count(" > "),
            -len(section.text),
            -(section.page_start or 0),
        ),
    )


def materialize_ground_truth_draft(
    samples: list[EvaluationSample],
    manifest: CorpusManifest,
    authority_matrix_path: Path,
    documents_dir: Path,
    spec_path: Path,
) -> list[dict[str, Any]]:
    specs = json.loads(spec_path.read_text(encoding="utf-8"))
    if not isinstance(specs, list):
        raise ValueError("Ground-truth spec must contain a JSON list")
    samples_by_id = {sample.id: sample for sample in samples if sample.category == "training_exam"}
    specs_by_id = {str(spec["sample_id"]): spec for spec in specs}
    if set(specs_by_id) != set(samples_by_id):
        raise ValueError(
            "Ground-truth spec coverage mismatch: "
            f"missing={sorted(set(samples_by_id) - set(specs_by_id))}, "
            f"extra={sorted(set(specs_by_id) - set(samples_by_id))}"
        )

    authority_payload = json.loads(authority_matrix_path.read_text(encoding="utf-8"))
    authority = {record["source_file"]: record for record in authority_payload["records"]}
    sections = load_evidence_sections(documents_dir)
    now = datetime.now(timezone.utc).isoformat()
    records: list[dict[str, Any]] = []

    for sample_id in sorted(specs_by_id):
        sample = samples_by_id[sample_id]
        spec = specs_by_id[sample_id]
        corpus_gap = bool(spec.get("corpus_gap"))
        reference_answer = str(spec.get("reference_answer") or "").strip()
        if len(reference_answer) < 40:
            raise ValueError(f"{sample_id}: reference_answer is too short")
        source_specs = list(spec.get("sources") or [])
        if corpus_gap and source_specs:
            raise ValueError(f"{sample_id}: corpus-gap sample cannot declare sources")
        if not corpus_gap and not source_specs:
            raise ValueError(f"{sample_id}: answerable sample needs at least one source")

        resolved_sources: list[dict[str, Any]] = []
        candidates: list[dict[str, Any]] = []
        for index, source_spec in enumerate(source_specs):
            source_file = str(source_spec["source_file"])
            if source_file not in manifest.source_files:
                raise ValueError(f"{sample_id}: source is outside corpus: {source_file}")
            authority_record = authority.get(source_file)
            if not authority_record or authority_record.get("status") not in RESOLVED_AUTHORITY_STATUSES:
                raise ValueError(f"{sample_id}: source authority is unresolved: {source_file}")
            section = _best_heading_match(
                sections,
                source_file,
                source_spec.get("heading_contains"),
            )
            resolved = {
                "source_file": source_file,
                "heading_path": section.heading_path if section else None,
                "page_start": section.page_start if section else None,
                "page_end": section.page_start if section else None,
            }
            resolved_sources.append(resolved)
            candidates.append(
                {
                    **resolved,
                    "relevance": 2 if index == 0 else 1,
                    "snippet": section.text[:500] if section else "",
                }
            )

        records.append(
            {
                "sample_id": sample.id,
                "question": sample.question,
                "category": sample.category,
                "difficulty": sample.difficulty.value,
                "reviewer": "ai_ground_truth_curator",
                "status": "needs_review",
                "reviewed_at": now,
                "review": {
                    "primary_sources": resolved_sources[:1],
                    "supporting_sources": resolved_sources[1:],
                    "reference_answer": reference_answer,
                    "corpus_gap": corpus_gap,
                    "notes": (
                        "AI-curated against the local authoritative corpus. "
                        "Requires two independent human approvals before benchmark use."
                    ),
                },
                "candidates": candidates,
            }
        )
    return records


def write_ground_truth_draft(records: list[dict[str, Any]], jsonl_path: Path, report_path: Path) -> None:
    write_jsonl(jsonl_path, records)
    lines = [
        "# Training/exam ground-truth audit",
        "",
        "> AI-curated draft. It is not an approved benchmark until two humans review it independently.",
        "",
    ]
    for record in records:
        review = record["review"]
        lines.extend([f"## {record['sample_id']}", "", f"Question: {record['question']}", ""])
        if review["corpus_gap"]:
            lines.append("Expected: `fallback` (corpus gap or false premise)")
        else:
            for source in [*review["primary_sources"], *review["supporting_sources"]]:
                lines.append(
                    f"- `{source['source_file']}` | `{source.get('heading_path') or 'document-level'}` "
                    f"| page `{source.get('page_start')}`"
                )
        lines.extend(["", "Reference answer:", "", review["reference_answer"], ""])
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_reviewer_packets(records: list[dict[str, Any]], output_dir: Path) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for reviewer in ("reviewer_1", "reviewer_2"):
        packet = []
        for record in records:
            packet.append(
                {
                    **record,
                    "reviewer": reviewer,
                    "status": "needs_review",
                    "reviewed_at": None,
                    "review_instructions": {
                        "allowed_statuses": ["approved", "rejected", "needs_review"],
                        "check": [
                            "question is answerable from the selected evidence",
                            "source and legal heading are correct",
                            "reference answer is complete and does not overclaim",
                            "scope, amendment and exceptions are preserved",
                        ],
                    },
                }
            )
        path = output_dir / f"{reviewer}.jsonl"
        write_jsonl(path, packet)
        paths.append(path)
    return paths
