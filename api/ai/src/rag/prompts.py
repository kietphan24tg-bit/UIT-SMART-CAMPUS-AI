from src.retrieval.retriever import RetrievalResult


RAG_SYSTEM_PROMPT = """
Bạn là trợ lý học vụ và dịch vụ sinh viên của UIT Smart Campus.

Nguyên tắc bắt buộc:
- Chỉ trả lời dựa trên CONTEXT được cung cấp.
- Không tự bịa quy chế, ngày tháng, điều kiện, mức phạt, chuẩn đầu ra hoặc thủ tục.
- Nếu CONTEXT không đủ thông tin, nói rõ: "Mình chưa tìm thấy thông tin đủ chắc trong tài liệu đã index."
- Khi trả lời về quy chế/quy định, giữ rõ Chương/Mục/Điều/Khoản nếu CONTEXT có.
- Nếu nhiều nguồn có vẻ khác nhau, ưu tiên nguồn có ngày ban hành/ngày hiệu lực mới hơn và nói rõ có nhiều nguồn.
- Trả lời bằng tiếng Việt, ngắn gọn, có cấu trúc dễ đọc.
- Luôn nhắc nguồn theo dạng [1], [2] khi dùng thông tin từ CONTEXT.
- Nếu câu hỏi cần dữ liệu cá nhân hoặc thời gian thực như lịch học hôm nay, điểm cá nhân, điểm danh, đặt phòng, thông báo chưa đọc, hãy nói phần đó cần gọi dịch vụ live của Smart Campus.
""".strip()


def build_context(results: list[RetrievalResult], max_chars: int = 14000) -> str:
    blocks: list[str] = []
    used_chars = 0
    for index, result in enumerate(results, start=1):
        metadata = result.metadata
        page = _page_label(metadata.get("page_start"), metadata.get("page_end"))
        block = "\n".join(
            [
                f"[{index}]",
                f"Source file: {metadata.get('source_file') or 'unknown'}",
                f"Source unit: {metadata.get('source_unit') or 'unknown'}",
                f"Category: {metadata.get('category') or 'unknown'}",
                f"Issued date: {metadata.get('issued_date') or 'unknown'}",
                f"Effective date: {metadata.get('effective_date') or 'unknown'}",
                f"Heading: {metadata.get('heading_path') or 'unknown'}",
                f"Page: {page}",
                "Content:",
                result.content.strip(),
            ]
        )
        if used_chars + len(block) > max_chars:
            break
        blocks.append(block)
        used_chars += len(block)
    return "\n\n".join(blocks)


def build_user_prompt(question: str, results: list[RetrievalResult]) -> str:
    context = build_context(results)
    return f"CONTEXT:\n{context}\n\nQUESTION:\n{question.strip()}"


def _page_label(page_start, page_end) -> str:
    if page_start and page_end and page_start != page_end:
        return f"{page_start}-{page_end}"
    if page_start:
        return str(page_start)
    return "unknown"
