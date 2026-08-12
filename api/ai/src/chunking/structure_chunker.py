import re
from dataclasses import replace

from src.chunking.fallback_chunker import FallbackChunker, TextChunk, estimate_tokens, normalize_whitespace


PAGE_RE = re.compile(r"<!--\s*page:\s*(\d+)\s*-->")
MARKDOWN_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
LEGAL_HEADING_RE = re.compile(
    r"^\s*((?:Chương|CHƯƠNG|Mục|MỤC)\s+[IVXLCDM\d]+|(?:Điều|ĐIỀU)\s+\d+[a-zA-Z]?\b[^.]*(?:\..*)?|(?:Khoản|KHOẢN)\s+\d+|[a-zđ]\))",
    re.IGNORECASE,
)


class StructureChunker:
    def __init__(self, max_tokens: int = 700, overlap_tokens: int = 100) -> None:
        self.max_tokens = max_tokens
        self.fallback = FallbackChunker(max_tokens=max_tokens, overlap_tokens=overlap_tokens)

    def chunk(self, markdown: str, metadata: dict | None = None) -> list[TextChunk]:
        blocks = self._split_blocks(markdown)
        sections = self._sections_from_blocks(blocks)
        if len(sections) <= 1 and not sections[0]["heading_path"]:
            return []

        chunks: list[TextChunk] = []
        for section in sections:
            text = normalize_whitespace(section["text"])
            if not text:
                continue
            section_metadata = dict(metadata or {})
            section_metadata["chunking_strategy"] = "structure_first"
            heading_path = " > ".join(section["heading_path"]) if section["heading_path"] else None
            parent_heading_path = self._parent_path(section["heading_path"])
            page_start, page_end = self._page_range(section["pages"])

            if estimate_tokens(text) <= self.max_tokens:
                chunks.append(
                    TextChunk(
                        content=text,
                        heading_path=heading_path,
                        parent_heading_path=parent_heading_path,
                        page_start=page_start,
                        page_end=page_end,
                        metadata=section_metadata,
                    )
                )
                continue

            child_chunks = self.fallback.chunk(text, metadata=section_metadata)
            for child in child_chunks:
                chunks.append(
                    replace(
                        child,
                        heading_path=heading_path,
                        parent_heading_path=parent_heading_path,
                        page_start=page_start,
                        page_end=page_end,
                    )
                )
        return chunks

    def _split_blocks(self, markdown: str) -> list[dict]:
        blocks: list[dict] = []
        current_lines: list[str] = []
        current_page: int | None = None

        for line in markdown.splitlines():
            page_match = PAGE_RE.search(line)
            if page_match:
                if current_lines:
                    blocks.append({"text": "\n".join(current_lines).strip(), "page": current_page})
                    current_lines = []
                current_page = int(page_match.group(1))
                continue

            if not line.strip():
                if current_lines:
                    blocks.append({"text": "\n".join(current_lines).strip(), "page": current_page})
                    current_lines = []
                continue

            if self._is_heading(line) and current_lines:
                blocks.append({"text": "\n".join(current_lines).strip(), "page": current_page})
                current_lines = [line]
            else:
                current_lines.append(line)

        if current_lines:
            blocks.append({"text": "\n".join(current_lines).strip(), "page": current_page})
        return [block for block in blocks if block["text"]]

    def _sections_from_blocks(self, blocks: list[dict]) -> list[dict]:
        sections: list[dict] = []
        heading_stack: list[tuple[int, str]] = []
        current = {"heading_path": [], "text": "", "pages": []}

        for block in blocks:
            heading = self._heading(block["text"])
            if heading:
                if current["text"].strip():
                    sections.append(current)
                level, title = heading
                heading_stack = [(item_level, item_title) for item_level, item_title in heading_stack if item_level < level]
                heading_stack.append((level, title))
                current = {
                    "heading_path": [item_title for _, item_title in heading_stack],
                    "text": block["text"],
                    "pages": [block["page"]] if block["page"] else [],
                }
            else:
                if current["text"]:
                    current["text"] += "\n\n" + block["text"]
                else:
                    current["text"] = block["text"]
                if block["page"]:
                    current["pages"].append(block["page"])

        if current["text"].strip():
            sections.append(current)
        return sections or [{"heading_path": [], "text": "", "pages": []}]

    def _is_heading(self, line: str) -> bool:
        return self._heading(line) is not None

    def _heading(self, text: str) -> tuple[int, str] | None:
        first_line = text.splitlines()[0].strip()
        markdown_match = MARKDOWN_HEADING_RE.match(first_line)
        if markdown_match:
            return len(markdown_match.group(1)), markdown_match.group(2).strip()

        legal_match = LEGAL_HEADING_RE.match(first_line)
        if not legal_match:
            return None

        title = first_line.rstrip(".")
        normalized = title.lower()
        if normalized.startswith("chương"):
            return 1, title
        if normalized.startswith("mục"):
            return 2, title
        if normalized.startswith("điều"):
            return 3, title
        if normalized.startswith("khoản"):
            return 4, title
        return 5, title

    def _parent_path(self, heading_path: list[str]) -> str | None:
        if len(heading_path) <= 1:
            return None
        return " > ".join(heading_path[:-1])

    def _page_range(self, pages: list[int]) -> tuple[int | None, int | None]:
        pages = [page for page in pages if page]
        if not pages:
            return None, None
        return min(pages), max(pages)
