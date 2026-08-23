import sys
import asyncio
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.rag.service import RagService
from src.core.config import settings

async def run_smoke_test():
    print(f"Reranker Enabled: {settings.reranker_enabled}")
    print(f"Hybrid Search Enabled: {settings.hybrid_search_enabled}")
    
    service = RagService()
    
    questions = [
        "Điều kiện dự thi học kỳ là gì?",
        "Sinh viên bị cảnh báo học vụ cần làm gì?",
        "Mức học phí tín chỉ hiện tại là bao nhiêu?",
        "Quy định về học bổng khuyến khích học tập?",
        "Thủ tục xin bảo lưu kết quả học tập?"
    ]
    
    for q in questions:
        print(f"\n[Q] {q}")
        try:
            resp = service.answer(q)
            print(f"Answer: {resp.answer[:200]}...")
            print(f"Type: {resp.answer_type} | Confidence: {resp.confidence}")
            print(f"Citations: {[c.source_file for c in resp.citations]}")
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_smoke_test())
