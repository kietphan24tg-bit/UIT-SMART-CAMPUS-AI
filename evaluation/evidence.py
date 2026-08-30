from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from src.chunking.structure_chunker import StructureChunker

PAGE_RE = re.compile(r"<!--\s*page:\s*(\d+)\s*-->")
SPACE_RE = re.compile(r"\s+")


@dataclass(frozen=True)
class EvidenceSection:
    source_file: str
    source_path: str | None
    source_url: str | None
    source_unit: str | None
    heading_path: str | None
    page_start: int | None
    text: str


def _frontmatter(text: str) -> tuple[dict[str, Any], str]:
    if not text.startswith("---\n"):
        return {}, text
    marker = text.find("\n---\n", 4)
    if marker < 0:
        return {}, text
    return yaml.safe_load(text[4:marker]) or {}, text[marker + 5 :]


def _clean_text(value: str) -> str:
    value = PAGE_RE.sub("", value)
    value = re.sub(r"^#{1,6}\s+", "", value, flags=re.MULTILINE)
    return SPACE_RE.sub(" ", value).strip()


def load_evidence_sections(documents_dir: Path) -> list[EvidenceSection]:
    grouped: dict[tuple[str, str | None], dict[str, Any]] = {}
    chunker = StructureChunker(max_tokens=700)
    for path in documents_dir.rglob("*.md"):
        metadata, body = _frontmatter(path.read_text(encoding="utf-8", errors="replace"))
        source_file = str(metadata.get("source_file") or path.name)
        for chunk in chunker.chunk(body, metadata):
            text = _clean_text(chunk.content)
            if len(text) < 40:
                continue
            group = grouped.setdefault(
                (source_file, chunk.heading_path),
                {"metadata": metadata, "texts": [], "pages": []},
            )
            group["texts"].append(text)
            if chunk.page_start is not None:
                group["pages"].append(chunk.page_start)

    sections: list[EvidenceSection] = []
    for (source_file, heading_path), group in grouped.items():
        metadata = group["metadata"]
        sections.append(
            EvidenceSection(
                source_file=source_file,
                source_path=str(metadata.get("source_path")) if metadata.get("source_path") else None,
                source_url=str(metadata.get("source_url")) if metadata.get("source_url") else None,
                source_unit=str(metadata.get("source_unit")) if metadata.get("source_unit") else None,
                heading_path=heading_path,
                page_start=min(group["pages"]) if group["pages"] else None,
                text=" ".join(group["texts"])[:8000],
            )
        )
    return sections
