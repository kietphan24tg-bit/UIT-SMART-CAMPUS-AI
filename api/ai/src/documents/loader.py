import hashlib
import json
import re
from pathlib import Path
from typing import Iterable

from src.documents.metadata import MarkdownDocument, metadata_from_dict, split_frontmatter


PAGE_SUFFIX_RE = re.compile(r"-page-\d+$", re.IGNORECASE)


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8", errors="ignore")).hexdigest()


def iter_markdown_files(root: Path) -> Iterable[Path]:
    yield from sorted(root.rglob("*.md"))


def iter_manifest_markdown_files(root: Path, manifest_name: str = "manifest-current.jsonl") -> Iterable[Path]:
    manifest_path = root / manifest_name
    if not manifest_path.exists():
        yield from iter_markdown_files(root)
        return

    seen_sha: set[str] = set()
    seen_content: set[str] = set()
    seen_body: set[str] = set()
    for line in manifest_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if not line.strip():
            continue
        record = json.loads(line)
        metadata = record.get("metadata") or {}
        if record.get("status") != "ok" or metadata.get("extraction_status") != "ok":
            continue

        output_path = Path(record.get("output_path") or "")
        if output_path.suffix.lower() != ".md" or not output_path.exists():
            continue

        if _has_non_page_sibling(output_path):
            continue

        source_sha = metadata.get("sha256")
        if source_sha and source_sha in seen_sha:
            continue

        text = output_path.read_text(encoding="utf-8", errors="ignore")
        content_hash = sha256_text(text)
        if content_hash in seen_content:
            continue

        _, body = split_frontmatter(text)
        body_hash = sha256_text(body)
        if body_hash in seen_body:
            continue

        if source_sha:
            seen_sha.add(source_sha)
        seen_content.add(content_hash)
        seen_body.add(body_hash)
        yield output_path


def load_markdown_document(path: Path) -> MarkdownDocument:
    content = path.read_text(encoding="utf-8", errors="ignore")
    metadata_dict, body = split_frontmatter(content)
    metadata = metadata_from_dict(metadata_dict, fallback_path=path)
    return MarkdownDocument(
        path=path,
        content=content,
        metadata=metadata,
        body=body,
        content_hash=sha256_text(content),
    )


def _has_non_page_sibling(path: Path) -> bool:
    stem = path.stem
    if not PAGE_SUFFIX_RE.search(stem):
        return False
    base_stem = PAGE_SUFFIX_RE.sub("", stem)
    return (path.with_name(f"{base_stem}{path.suffix}")).exists()
