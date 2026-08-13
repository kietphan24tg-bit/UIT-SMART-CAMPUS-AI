from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml


FRONTMATTER_DELIMITER = "---"


@dataclass(frozen=True)
class DocumentMetadata:
    source_file: str
    source_unit: str
    category: str
    extraction_status: str
    title: str | None = None
    source_path: str | None = None
    source_url: str | None = None
    source_type: str | None = None
    level: str | None = None
    document_number: str | None = None
    issued_date: str | None = None
    effective_date: str | None = None
    is_current: str | bool | None = None
    language: str | None = "vi"
    sha256: str | None = None
    page_count: int | None = None
    extraction_method: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class MarkdownDocument:
    path: Path
    content: str
    metadata: DocumentMetadata
    body: str
    content_hash: str


def repair_mojibake(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    if not any(marker in value for marker in ("Ã", "Ä", "áº", "á»", "Â")):
        return value
    try:
        repaired = value.encode("latin1").decode("utf-8")
    except UnicodeError:
        return value
    return repaired if repaired.count("\ufffd") <= value.count("\ufffd") else value


def split_frontmatter(markdown: str) -> tuple[dict[str, Any], str]:
    if not markdown.startswith(FRONTMATTER_DELIMITER):
        return {}, markdown

    lines = markdown.splitlines()
    if not lines or lines[0].strip() != FRONTMATTER_DELIMITER:
        return {}, markdown

    end_index = None
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == FRONTMATTER_DELIMITER:
            end_index = index
            break

    if end_index is None:
        return {}, markdown

    raw_yaml = "\n".join(lines[1:end_index])
    body = "\n".join(lines[end_index + 1 :]).lstrip()
    parsed = yaml.safe_load(raw_yaml) or {}
    if not isinstance(parsed, dict):
        return {}, body
    return {str(key): repair_mojibake(value) for key, value in parsed.items()}, body


def metadata_from_dict(data: dict[str, Any], fallback_path: Path | None = None) -> DocumentMetadata:
    source_file = str(data.get("source_file") or (fallback_path.name if fallback_path else "unknown"))
    return DocumentMetadata(
        title=repair_mojibake(data.get("title")),
        source_file=source_file,
        source_path=data.get("source_path"),
        source_url=data.get("source_url"),
        source_unit=str(data.get("source_unit") or "unknown"),
        source_type=data.get("source_type"),
        category=str(data.get("category") or "unknown"),
        level=data.get("level"),
        document_number=repair_mojibake(data.get("document_number")),
        issued_date=str(data["issued_date"]) if data.get("issued_date") else None,
        effective_date=str(data["effective_date"]) if data.get("effective_date") else None,
        is_current=data.get("is_current"),
        language=data.get("language") or "vi",
        sha256=data.get("sha256"),
        page_count=data.get("page_count"),
        extraction_method=data.get("extraction_method"),
        extraction_status=str(data.get("extraction_status") or "unknown"),
        raw=data,
    )
