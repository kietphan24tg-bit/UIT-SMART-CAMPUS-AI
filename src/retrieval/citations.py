from dataclasses import dataclass
import re

from src.api.schemas import Citation


@dataclass(frozen=True)
class CitationValidationResult:
    cleaned_answer: str
    total_citations: int
    valid_citations: list[int]
    invalid_citations: list[int]
    validity_rate: float
    has_unsupported_citation: bool


def score_from_distance(distance: float | None) -> float:
    if distance is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - float(distance)))


def citation_from_result(result: dict, index: int | None = None) -> Citation:
    metadata = result.get("metadata") or {}
    distance = result.get("distance")
    return Citation(
        index=index,
        source_file=result.get("source_file") or metadata.get("source_file") or "unknown",
        source_url=result.get("source_url") or metadata.get("source_url"),
        source_unit=result.get("source_unit") or metadata.get("source_unit"),
        category=result.get("category") or metadata.get("category"),
        heading_path=result.get("heading_path") or metadata.get("heading_path"),
        parent_heading_path=result.get("parent_heading_path") or metadata.get("parent_heading_path"),
        page_start=result.get("page_start") or metadata.get("page_start"),
        page_end=result.get("page_end") or metadata.get("page_end"),
        distance=float(distance) if distance is not None else None,
        score=score_from_distance(distance),
    )


def format_citations(results: list[dict]) -> list[Citation]:
    seen: set[tuple] = set()
    citations: list[Citation] = []
    for result in results:
        citation = citation_from_result(result)
        key = (
            citation.source_file,
            citation.heading_path,
            citation.page_start,
            citation.page_end,
        )
        if key in seen:
            continue
        seen.add(key)
        citations.append(citation)
    return citations


def validate_and_clean_citations(answer: str, context_count: int) -> CitationValidationResult:
    """Validate citation indices [N] in generated answer against context count.

    Removes out-of-range citations (N < 1 or N > context_count) and returns clean text
    along with citation validation statistics.
    """
    valid_citations: list[int] = []
    invalid_citations: list[int] = []
    total_citations = 0

    def _replace_group(match: re.Match[str]) -> str:
        nonlocal total_citations
        body = match.group(1)
        # Only treat a bracket as a citation group when it consists of numeric
        # indices separated by comma/semicolon/whitespace. Other brackets are
        # ordinary answer text and must be preserved.
        if not re.fullmatch(r"\s*\d+(?:\s*[,;]\s*\d+)*\s*", body):
            return match.group(0)

        indices = [int(value) for value in re.findall(r"\d+", body)]
        total_citations += len(indices)
        normalized: list[str] = []
        for index in indices:
            if 1 <= index <= context_count:
                valid_citations.append(index)
                normalized.append(f"[{index}]")
            else:
                invalid_citations.append(index)
        return " ".join(normalized)

    cleaned_answer = re.sub(r"\[([^\]]+)\]", _replace_group, answer)
    cleaned_answer = re.sub(r"\s{2,}", " ", cleaned_answer).strip()

    validity_rate = (len(valid_citations) / total_citations) if total_citations > 0 else 1.0
    has_unsupported = len(invalid_citations) > 0

    return CitationValidationResult(
        cleaned_answer=cleaned_answer,
        total_citations=total_citations,
        valid_citations=valid_citations,
        invalid_citations=invalid_citations,
        validity_rate=round(validity_rate, 4),
        has_unsupported_citation=has_unsupported,
    )
