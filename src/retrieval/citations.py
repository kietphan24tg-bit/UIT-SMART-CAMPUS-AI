from src.api.schemas import Citation


def score_from_distance(distance: float | None) -> float:
    if distance is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - float(distance)))


def citation_from_result(result: dict) -> Citation:
    metadata = result.get("metadata") or {}
    distance = result.get("distance")
    return Citation(
        source_file=result.get("source_file") or metadata.get("source_file") or "unknown",
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
