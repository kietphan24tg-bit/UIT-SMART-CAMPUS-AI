from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


def _normalize(text: str) -> str:
    lowered = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9\s]+", " ", lowered)


def _contains_phrase(text: str, phrase: str) -> bool:
    normalized_text = f" {_normalize(text)} "
    normalized_phrase = f" {_normalize(phrase).strip()} "
    return normalized_phrase.strip() != "" and normalized_phrase in normalized_text


@dataclass(frozen=True)
class TaxonomyEntry:
    domain: str
    aliases: tuple[str, ...]
    source_units: tuple[str, ...]
    categories: tuple[str, ...]
    authority_rank: int


TAXONOMY_VERSION = "2026-08-25"

TAXONOMY: tuple[TaxonomyEntry, ...] = (
    TaxonomyEntry(
        domain="training_regulation",
        aliases=(
            "quy che dao tao",
            "hoc che tin chi",
            "dang ky tin chi",
            "xet tot nghiep",
            "tot nghiep",
        ),
        source_units=("DAA",),
        categories=("training_regulation",),
        authority_rank=4,
    ),
    TaxonomyEntry(
        domain="exam",
        aliases=(
            "dieu kien du thi",
            "quy che thi",
            "du thi",
            "thi cuoi ky",
            "kiem tra",
            "diem thi",
            "phuc khao",
        ),
        source_units=("DAA",),
        categories=("exam",),
        authority_rank=5,
    ),
    TaxonomyEntry(
        domain="tuition",
        aliases=("hoc phi", "mien giam hoc phi", "dong hoc phi", "hoan hoc phi"),
        source_units=("CTSV", "DAA"),
        categories=("tuition_procedure", "student_affairs"),
        authority_rank=4,
    ),
    TaxonomyEntry(
        domain="student_procedure",
        aliases=("cam nang sinh vien", "thu tuc sinh vien", "giay xac nhan", "the sinh vien"),
        source_units=("CTSV",),
        categories=("student_handbook", "student_affairs"),
        authority_rank=3,
    ),
    TaxonomyEntry(
        domain="learning_outcome",
        aliases=("chuan dau ra", "plo", "cdio", "ky nang dau ra"),
        source_units=("DAA",),
        categories=("learning_outcome",),
        authority_rank=4,
    ),
)


@dataclass(frozen=True)
class QueryHint:
    domain: str | None
    aliases: tuple[str, ...]
    source_units: tuple[str, ...]
    categories: tuple[str, ...]
    prompt_injection: bool
    out_of_scope: bool


def classify_query(question: str) -> QueryHint:
    normalized = _normalize(question)
    matched_entry: TaxonomyEntry | None = None
    matched_aliases: list[str] = []
    for entry in TAXONOMY:
        hits = [alias for alias in entry.aliases if _contains_phrase(normalized, alias)]
        if hits and (matched_entry is None or len(hits) > len(matched_aliases)):
            matched_entry = entry
            matched_aliases = hits

    injection = any(
        phrase in normalized
        for phrase in (
            "ignore previous instructions",
            "bo qua huong dan",
            "system prompt",
            "tool call",
            "developer message",
            "in ra token",
            "show me the secret",
        )
    )
    out_of_scope = any(
        phrase in normalized
        for phrase in (
            "thoi tiet",
            "gia vang",
            "bong da",
            "thi dau the thao",
            "chung khoan",
            "bitcoin",
        )
    )
    if matched_entry is None:
        return QueryHint(
            domain=None,
            aliases=(),
            source_units=(),
            categories=(),
            prompt_injection=injection,
            out_of_scope=out_of_scope,
        )
    return QueryHint(
        domain=matched_entry.domain,
        aliases=tuple(matched_aliases),
        source_units=matched_entry.source_units,
        categories=matched_entry.categories,
        prompt_injection=injection,
        out_of_scope=out_of_scope,
    )


def enrich_metadata(metadata: dict, *, source_unit: str | None = None, category: str | None = None) -> dict:
    output = dict(metadata)
    title_parts = [
        str(output.get("title") or ""),
        str(output.get("source_file") or ""),
        str(output.get("heading_path") or ""),
    ]
    haystack = " ".join(part for part in title_parts if part)
    matched = [
        entry
        for entry in TAXONOMY
        if any(_contains_phrase(haystack, alias) for alias in entry.aliases)
        or (source_unit and source_unit in entry.source_units)
        or (category and category in entry.categories)
    ]
    if matched:
        best = max(matched, key=lambda entry: entry.authority_rank)
        output.setdefault("taxonomy_version", TAXONOMY_VERSION)
        output.setdefault("taxonomy_domain", best.domain)
        output.setdefault("taxonomy_aliases", list(best.aliases))
        output.setdefault("source_unit_preference", list(best.source_units))
        output.setdefault("authority_rank", best.authority_rank)
    return output


def authority_score(metadata: dict) -> float:
    authority = int(metadata.get("authority_rank") or 0)
    source_unit = str(metadata.get("source_unit") or "").upper()
    if authority:
        return min(authority / 5.0, 1.0)
    if source_unit == "DAA":
        return 1.0
    if source_unit == "CTSV":
        return 0.85
    if source_unit == "SDH":
        return 0.75
    return 0.5

