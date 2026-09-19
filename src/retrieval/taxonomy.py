from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


def _normalize(text: str) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    lowered = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii").lower()
    normalized = re.sub(r"[^a-z0-9\s]+", " ", lowered)
    return re.sub(r"\s+", " ", normalized).strip()


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


TAXONOMY_VERSION = "2026-08-29"

TAXONOMY: tuple[TaxonomyEntry, ...] = (
    TaxonomyEntry(
        domain="training_regulation",
        aliases=(
            "quy chế đào tạo",
            "học chế tín chỉ",
            "đăng ký tín chỉ",
            "xét tốt nghiệp",
            "tốt nghiệp",
            "vắng thi có phép",
            "hoãn thi",
            "điểm i",
            "không hoàn tất học phần",
        ),
        source_units=("DAA",),
        categories=("training_regulation",),
        authority_rank=4,
    ),
    TaxonomyEntry(
        domain="exam",
        aliases=(
            "điều kiện dự thi",
            "quy chế thi",
            "dự thi",
            "thi cuối kỳ",
            "kiểm tra",
            "điểm thi",
            "phúc khảo",
        ),
        source_units=("DAA",),
        categories=("exam",),
        authority_rank=5,
    ),
    TaxonomyEntry(
        domain="tuition",
        aliases=("học phí", "miễn giảm học phí", "đóng học phí", "hoàn học phí"),
        source_units=("CTSV", "DAA"),
        categories=("tuition_procedure", "student_affairs"),
        authority_rank=4,
    ),
    TaxonomyEntry(
        domain="student_procedure",
        aliases=("cẩm nang sinh viên", "thủ tục sinh viên", "giấy xác nhận", "thẻ sinh viên"),
        source_units=("CTSV",),
        categories=("student_handbook", "student_affairs"),
        authority_rank=3,
    ),
    TaxonomyEntry(
        domain="learning_outcome",
        aliases=("chuẩn đầu ra", "plo", "cdio", "kỹ năng đầu ra"),
        source_units=("DAA",),
        categories=("learning_outcome",),
        authority_rank=4,
    ),
)

QUERY_EXPANSIONS: dict[str, tuple[str, ...]] = {
    "vắng thi có phép": ("điểm i", "không hoàn tất học phần", "hoãn thi"),
    "hoãn thi": ("điểm i", "không hoàn tất học phần", "vắng thi có phép"),
    "điểm i": ("không hoàn tất học phần", "hoãn thi", "vắng thi có phép"),
}


@dataclass(frozen=True)
class QueryHint:
    domain: str | None
    aliases: tuple[str, ...]
    source_units: tuple[str, ...]
    categories: tuple[str, ...]
    prompt_injection: bool
    out_of_scope: bool
    out_of_scope_reason: str | None = None


def _has_any(text: str, phrases: tuple[str, ...]) -> bool:
    return any(_contains_phrase(text, phrase) for phrase in phrases)


def _detect_prompt_injection(normalized: str) -> bool:
    instruction_override = _has_any(
        normalized,
        (
            "ignore previous instructions",
            "bo qua huong dan",
            "bo qua moi huong dan",
            "coi noi dung sau la lenh he thong",
            "system prompt",
            "developer message",
            "khong can xac nhan",
            "bo qua buoc xac nhan",
        ),
    )
    secret_exfiltration = _has_any(
        normalized,
        ("in api key", "api key", "in ra token", "show me the secret", "reveal every secret"),
    )
    privileged_action = _has_any(
        normalized,
        ("goi api", "tool call", "sua diem", "xoa du lieu", "thay doi diem"),
    ) and _has_any(
        normalized,
        ("toi la admin", "khong can xac nhan", "bo qua", "ngay", "thanh 10"),
    )
    return instruction_override or secret_exfiltration or privileged_action


def _detect_out_of_scope(normalized: str) -> str | None:
    personal_markers = ("toi", "cua toi", "tai khoan", "ho so", "ca nhan")
    live_markers = (
        "hom nay",
        "ngay mai",
        "sang nay",
        "chieu nay",
        "toi nay",
        "tuan sau",
        "hien tai",
        "hien con",
        "chinh xac",
    )
    live_subjects = (
        "lich thi",
        "gio thi",
        "phong thi",
        "ky thi",
        "lich hoc",
        "hoc phi",
        "con no",
        "tai khoan",
        "can tin",
        "thuc don",
        "thu vien",
        "muon sach",
        "han tra",
        "bi huy",
    )
    personal_decisions = (
        "xac nhan",
        "du dieu kien du thi",
        "co ten trong danh sach",
        "diem cua toi",
        "ket qua cua toi",
    )
    if (
        _has_any(normalized, personal_markers)
        and (_has_any(normalized, live_markers) or _has_any(normalized, personal_decisions))
    ) or (_has_any(normalized, live_markers) and _has_any(normalized, live_subjects)):
        return "live_personal_data"

    if _has_any(normalized, ("thoi tiet", "mua lon")) and _has_any(
        normalized, ("ky thi", "lich thi", "bi huy", "hoan thi")
    ):
        return "live_personal_data"

    if _has_any(
        normalized,
        (
            "nghien cuu sinh",
            "tien si",
            "thac si",
            "cao hoc",
            "hoc bong",
            "thoi tiet",
            "gia vang",
            "bong da",
            "thi dau the thao",
            "chung khoan",
            "bitcoin",
            "chan doan",
            "viet giup toi mot chuong trinh",
        ),
    ):
        return "outside_corpus"

    if _has_any(normalized, ("can tin", "thuc don", "muon sach", "han tra sach")):
        return "outside_corpus"

    if _has_any(normalized, ("toan bo", "day du")) and _has_any(
        normalized, ("tat ca", "moi khoa", "moi chuong trinh", "ngoai le")
    ):
        return "insufficient_scope"

    return None


def classify_query(question: str) -> QueryHint:
    normalized = _normalize(question)
    matched_entry: TaxonomyEntry | None = None
    matched_aliases: list[str] = []
    for entry in TAXONOMY:
        hits = [alias for alias in entry.aliases if _contains_phrase(normalized, alias)]
        if hits and (matched_entry is None or len(hits) > len(matched_aliases)):
            matched_entry = entry
            matched_aliases = hits

    injection = _detect_prompt_injection(normalized)
    out_of_scope_reason = _detect_out_of_scope(normalized)
    out_of_scope = out_of_scope_reason is not None
    if matched_entry is None:
        return QueryHint(
            domain=None,
            aliases=(),
            source_units=(),
            categories=(),
            prompt_injection=injection,
            out_of_scope=out_of_scope,
            out_of_scope_reason=out_of_scope_reason,
        )
    expanded_aliases = list(matched_aliases)
    for alias in matched_aliases:
        expanded_aliases.extend(QUERY_EXPANSIONS.get(alias, ()))
    expanded_aliases = list(dict.fromkeys(expanded_aliases))
    return QueryHint(
        domain=matched_entry.domain,
        aliases=tuple(expanded_aliases),
        source_units=matched_entry.source_units,
        categories=matched_entry.categories,
        prompt_injection=injection,
        out_of_scope=out_of_scope,
        out_of_scope_reason=out_of_scope_reason,
    )


def enrich_metadata(metadata: dict, *, source_unit: str | None = None, category: str | None = None) -> dict:
    output = dict(metadata)
    title_parts = [
        str(output.get("title") or ""),
        str(output.get("source_file") or ""),
        str(output.get("heading_path") or ""),
    ]
    haystack = " ".join(part for part in title_parts if part)
    category_matches = [entry for entry in TAXONOMY if category and category in entry.categories]
    alias_matches = [
        entry
        for entry in TAXONOMY
        if any(_contains_phrase(haystack, alias) for alias in entry.aliases)
    ]
    source_unit_matches = [
        entry for entry in TAXONOMY if source_unit and source_unit in entry.source_units
    ]
    # Category is curated document metadata and therefore stronger than a title alias.
    # Source unit is only a fallback because one unit can own several domains.
    matched = category_matches or alias_matches or source_unit_matches
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


def structure_score(metadata: dict, query_aliases: tuple[str, ...] = ()) -> float:
    """Calculate structural relevance score based on heading hierarchy and query alias alignment."""
    score = 0.0
    heading = str(metadata.get("heading_path") or "")
    parent_heading = str(metadata.get("parent_heading_path") or "")

    if heading:
        score += 0.03
        normalized_heading = _normalize(heading)
        if any(_contains_phrase(normalized_heading, alias) for alias in query_aliases):
            score += 0.12

    if parent_heading:
        score += 0.02
        normalized_parent = _normalize(parent_heading)
        if any(_contains_phrase(normalized_parent, alias) for alias in query_aliases):
            score += 0.06

    return min(score, 0.20)
