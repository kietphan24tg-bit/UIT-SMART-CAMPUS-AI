"""Research corpus manifests and retrieval filters."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from src.chunking.structure_chunker import StructureChunker
from src.documents.metadata import split_frontmatter


PAGE_MARKER_RE = re.compile(r"<!--\s*page:\s*(\d+)\s*-->")
CHAPTER_RE = re.compile(r"(?im)^\s*(?:#{1,6}\s+)?chương\s+[IVXLCDM\d]+")
SECTION_RE = re.compile(r"(?im)^\s*(?:#{1,6}\s+)?mục\s+[IVXLCDM\d]+")
ARTICLE_RE = re.compile(r"(?im)^\s*(?:#{1,6}\s+)?điều\s+\d+[a-z]?")
MOJIBAKE_MARKERS = ("Ãƒ", "Ã„", "Ã¡", "Æ°", "Ä‘", "áº", "á»")
OCR_NOISE_RE = re.compile(r"[Ø®ŸÏÚ]")
RESOLVED_AUTHORITY_STATUSES = {"verified_current", "verified_superseded", "partially_amended"}


class CorpusManifest:
    def __init__(self, path: Path, payload: dict[str, Any]) -> None:
        self.path = path
        self.payload = payload
        self.corpus_id = str(payload.get("corpus_id") or "")
        self.version = str(payload.get("version") or "")
        self.documents = list(payload.get("documents") or [])

    @property
    def source_files(self) -> frozenset[str]:
        return frozenset(
            str(document["source_file"])
            for document in self.documents
            if document.get("source_file")
        )

    @property
    def normalized_files(self) -> frozenset[str]:
        return frozenset(
            str(document["normalized_file"])
            for document in self.documents
            if document.get("normalized_file")
        )

    def retrieval_filters(self) -> dict[str, list[str]]:
        if not self.source_files:
            raise ValueError(f"Corpus manifest has no source files: {self.path}")
        # PgVectorStore applies source_files to the joined documents table.
        return {"source_files": sorted(self.source_files)}


def load_corpus_manifest(path: Path) -> CorpusManifest:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"Corpus manifest must contain a JSON object: {path}")
    return CorpusManifest(path, payload)


def _duplicates(values: list[str]) -> list[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in values:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    return sorted(duplicates)


def _load_authority_records(path: Path) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"Authority matrix must contain a JSON object: {path}")
    records = {
        str(record["source_file"]): record
        for record in payload.get("records", [])
        if isinstance(record, dict) and record.get("source_file")
    }
    return payload, records


def _source_catalog_files(manifest: CorpusManifest) -> set[str] | None:
    configured = manifest.payload.get("source_catalog")
    if not configured:
        return None
    path = (manifest.path.parent / str(configured)).resolve()
    if not path.exists():
        return None
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {
        str(record["source_file"])
        for record in payload
        if isinstance(record, dict) and record.get("source_file")
    }


def validate_corpus(
    manifest: CorpusManifest,
    authority_matrix_path: Path,
    *,
    max_tokens: int = 700,
) -> dict[str, Any]:
    """Validate curated corpus integrity and report manual authority work separately."""
    errors: list[str] = []
    warnings: list[str] = []
    authority_payload, authority_records = _load_authority_records(authority_matrix_path)
    catalog_files = _source_catalog_files(manifest)
    chunker = StructureChunker(max_tokens=max_tokens)
    source_root = Path(str(manifest.payload.get("source_root") or ""))
    normalized_paths = (
        {path.name: path for path in source_root.rglob("*.md")}
        if source_root.is_dir()
        else {}
    )

    if authority_payload.get("corpus_id") != manifest.corpus_id:
        errors.append("Authority matrix corpus_id does not match manifest corpus_id")
    if manifest.payload.get("document_count") != len(manifest.documents):
        errors.append("Manifest document_count does not match documents length")
    if not source_root.is_dir():
        errors.append(f"Manifest source_root does not exist: {source_root}")

    for field in ("source_file", "normalized_file", "curated_file"):
        values = [str(item[field]) for item in manifest.documents if item.get(field)]
        for duplicate in _duplicates(values):
            errors.append(f"Duplicate {field}: {duplicate}")

    document_reports: list[dict[str, Any]] = []
    for document in manifest.documents:
        source_file = str(document.get("source_file") or "")
        curated_file = str(document.get("curated_file") or "")
        normalized_file = str(document.get("normalized_file") or "")
        document_errors: list[str] = []
        document_warnings: list[str] = []
        report: dict[str, Any] = {
            "source_file": source_file,
            "normalized_file": normalized_file,
            "curated_file": curated_file,
            "role": document.get("role"),
            "topic": document.get("topic"),
        }

        if not source_file or not normalized_file or not curated_file:
            document_errors.append("Manifest record is missing source_file, normalized_file or curated_file")
        if catalog_files is not None and source_file not in catalog_files:
            document_errors.append("source_file is absent from the PostgreSQL source catalog export")
        normalized_path = normalized_paths.get(normalized_file)
        if normalized_file and normalized_path is None:
            document_errors.append("normalized_file does not exist under source_root")
        elif normalized_path is not None:
            report["normalized_path"] = str(normalized_path)

        authority = authority_records.get(source_file)
        if authority is None:
            document_errors.append("No matching authority matrix record")
        else:
            report["authority_status"] = authority.get("status")
            if authority.get("normalized_file") != normalized_file:
                document_errors.append("normalized_file differs between manifest and authority matrix")
            if document.get("effective_status") != authority.get("status"):
                document_errors.append("effective_status differs between manifest and authority matrix")
            if authority.get("status") not in RESOLVED_AUTHORITY_STATUSES:
                document_warnings.append(
                    f"Authority status is {authority.get('status')!r}; manual legal verification is still required"
                )

        curated_path = (manifest.path.parent / curated_file).resolve() if curated_file else None
        if curated_path is None or not curated_path.exists():
            document_errors.append("Curated Markdown file does not exist")
        else:
            try:
                text = curated_path.read_text(encoding="utf-8", errors="strict")
            except UnicodeError as exc:
                document_errors.append(f"Curated Markdown is not valid UTF-8: {exc}")
            else:
                metadata, body = split_frontmatter(text)
                pages = [int(value) for value in PAGE_MARKER_RE.findall(body)]
                chunks = chunker.chunk(body, metadata)
                structured_chunks = [chunk for chunk in chunks if chunk.heading_path]
                mojibake_count = sum(text.count(marker) for marker in MOJIBAKE_MARKERS)
                ocr_noise_lines = sum(bool(OCR_NOISE_RE.search(line)) for line in body.splitlines())

                report.update(
                    {
                        "bytes": len(text.encode("utf-8")),
                        "page_marker_count": len(pages),
                        "page_start": min(pages) if pages else None,
                        "page_end": max(pages) if pages else None,
                        "chapter_heading_count": len(CHAPTER_RE.findall(body)),
                        "section_heading_count": len(SECTION_RE.findall(body)),
                        "article_heading_count": len(ARTICLE_RE.findall(body)),
                        "chunk_count": len(chunks),
                        "structured_chunk_count": len(structured_chunks),
                        "replacement_character_count": text.count("\ufffd"),
                        "mojibake_marker_count": mojibake_count,
                        "ocr_noise_line_count": ocr_noise_lines,
                    }
                )

                expected_metadata = {
                    "corpus_id": manifest.corpus_id,
                    "corpus_version": manifest.version,
                    "source_file": source_file,
                    "normalized_file": normalized_file,
                }
                for key, expected in expected_metadata.items():
                    if str(metadata.get(key) or "") != str(expected):
                        document_errors.append(f"Frontmatter {key} does not match manifest")
                if not body.strip():
                    document_errors.append("Curated Markdown body is empty")
                if not pages:
                    document_errors.append("No page markers were preserved")
                elif pages != sorted(pages) or len(pages) != len(set(pages)):
                    document_errors.append("Page markers are duplicated or out of order")
                if not chunks:
                    document_errors.append("Document cannot produce structure-aware chunks")
                if text.count("\ufffd"):
                    document_errors.append("Document contains Unicode replacement characters")
                if mojibake_count:
                    document_warnings.append(f"Detected {mojibake_count} possible mojibake markers")
                if ocr_noise_lines:
                    document_warnings.append(f"Detected {ocr_noise_lines} lines with suspicious OCR symbols")
                if not structured_chunks:
                    document_warnings.append("No chunk has a structural heading path")
                if document.get("role") in {"primary", "specialized_primary"} and not ARTICLE_RE.search(body):
                    document_warnings.append("Primary regulation has no recognized Điều heading")

        report["errors"] = document_errors
        report["warnings"] = document_warnings
        report["technical_status"] = "failed" if document_errors else "passed"
        document_reports.append(report)
        errors.extend(f"{source_file}: {message}" for message in document_errors)
        warnings.extend(f"{source_file}: {message}" for message in document_warnings)

    orphan_authority = sorted(set(authority_records) - manifest.source_files)
    for source_file in orphan_authority:
        warnings.append(f"Authority matrix record is not present in manifest: {source_file}")

    unresolved_authority = sum(
        1
        for report in document_reports
        if report.get("authority_status") not in RESOLVED_AUTHORITY_STATUSES
    )
    return {
        "corpus_id": manifest.corpus_id,
        "corpus_version": manifest.version,
        "manifest": str(manifest.path),
        "authority_matrix": str(authority_matrix_path),
        "summary": {
            "document_count": len(document_reports),
            "technical_pass_count": sum(report["technical_status"] == "passed" for report in document_reports),
            "error_count": len(errors),
            "warning_count": len(warnings),
            "unresolved_authority_count": unresolved_authority,
            "ready_for_dataset_drafting": not errors,
            "ready_for_final_ground_truth": not errors and unresolved_authority == 0,
        },
        "documents": document_reports,
        "errors": errors,
        "warnings": warnings,
    }


def write_corpus_quality_report(report: dict[str, Any], output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    json_path = output_dir / "quality_report.json"
    markdown_path = output_dir / "quality_report.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = report["summary"]
    lines = [
        f"# Corpus quality report: {report['corpus_id']}",
        "",
        f"- Technical errors: {summary['error_count']}",
        f"- Warnings: {summary['warning_count']}",
        f"- Documents passing technical checks: {summary['technical_pass_count']}/{summary['document_count']}",
        f"- Documents requiring authority verification: {summary['unresolved_authority_count']}",
        f"- Ready for dataset drafting: {summary['ready_for_dataset_drafting']}",
        f"- Ready for final ground truth: {summary['ready_for_final_ground_truth']}",
        "",
        "| Source | Pages | Articles | Chunks | Authority | Technical |",
        "|---|---:|---:|---:|---|---|",
    ]
    for document in report["documents"]:
        lines.append(
            "| {source} | {pages} | {articles} | {chunks} | {authority} | {technical} |".format(
                source=document["source_file"],
                pages=document.get("page_marker_count", 0),
                articles=document.get("article_heading_count", 0),
                chunks=document.get("chunk_count", 0),
                authority=document.get("authority_status", "missing"),
                technical=document["technical_status"],
            )
        )
    for title, key in (("Blocking errors", "errors"), ("Warnings", "warnings")):
        lines.extend(["", f"## {title}", ""])
        values = report[key]
        lines.extend(f"- {value}" for value in values) if values else lines.append("- None")
    markdown_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return json_path, markdown_path
