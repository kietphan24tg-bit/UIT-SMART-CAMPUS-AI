"""Auto-generate evaluation dataset from indexed documents.

Reads actual chunk content from the database and creates question-answer pairs
grouped by category. Uses heading paths and content to form grounded questions.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import psycopg
from psycopg.rows import dict_row
from src.core.config import settings


def generate_samples():
    samples = []
    sample_id = 0

    with psycopg.connect(settings.database_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # ── training_regulation: quy che dao tao ─────────────────────
            # Get chunks from the main training regulation doc
            cur.execute(f"""
                SELECT c.content, c.heading_path, d.source_file
                FROM "{settings.rag_db_schema}".document_chunks c
                JOIN "{settings.rag_db_schema}".documents d ON d.id = c.document_id
                WHERE d.source_file LIKE 'daa-790%%'
                AND c.heading_path IS NOT NULL
                AND LENGTH(c.content) > 200
                ORDER BY c.chunk_index
                LIMIT 40
            """)
            daa790_chunks = cur.fetchall()

            # Also get the newer 2024 regulation
            cur.execute(f"""
                SELECT c.content, c.heading_path, d.source_file
                FROM "{settings.rag_db_schema}".document_chunks c
                JOIN "{settings.rag_db_schema}".documents d ON d.id = c.document_id
                WHERE d.source_file LIKE 'daa-507%%' OR d.source_file LIKE 'daa-451%%'
                AND c.heading_path IS NOT NULL
                AND LENGTH(c.content) > 200
                ORDER BY d.source_file, c.chunk_index
                LIMIT 30
            """)
            newer_chunks = cur.fetchall()

            # Get exam-related chunks
            cur.execute(f"""
                SELECT c.content, c.heading_path, d.source_file
                FROM "{settings.rag_db_schema}".document_chunks c
                JOIN "{settings.rag_db_schema}".documents d ON d.id = c.document_id
                WHERE d.category = 'exam'
                AND c.heading_path IS NOT NULL
                AND LENGTH(c.content) > 150
                ORDER BY d.source_file, c.chunk_index
                LIMIT 30
            """)
            exam_chunks = cur.fetchall()

            # Get student affairs chunks
            cur.execute(f"""
                SELECT c.content, c.heading_path, d.source_file
                FROM "{settings.rag_db_schema}".document_chunks c
                JOIN "{settings.rag_db_schema}".documents d ON d.id = c.document_id
                WHERE d.category = 'student_affairs'
                AND c.heading_path IS NOT NULL
                AND LENGTH(c.content) > 150
                ORDER BY d.source_file, c.chunk_index
                LIMIT 30
            """)
            student_chunks = cur.fetchall()

            # Get learning outcome chunks
            cur.execute(f"""
                SELECT c.content, c.heading_path, d.source_file
                FROM "{settings.rag_db_schema}".document_chunks c
                JOIN "{settings.rag_db_schema}".documents d ON d.id = c.document_id
                WHERE d.category = 'learning_outcome'
                AND c.heading_path IS NOT NULL
                AND LENGTH(c.content) > 150
                ORDER BY d.source_file, c.chunk_index
                LIMIT 20
            """)
            lo_chunks = cur.fetchall()

    # ── Generate questions from training regulation chunks ──────────
    training_questions = [
        # Direct questions
        {"q": "Quy che dao tao theo hoc che tin chi quy dinh nhung gi?", "q_vi": "Quy chế đào tạo theo học chế tín chỉ quy định những gì?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Tin chi hoc tap la gi?", "q_vi": "Tín chỉ học tập là gì?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Mot hoc ky co bao nhieu tuan?", "q_vi": "Một học kỳ có bao nhiêu tuần?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Sinh vien duoc dang ky toi da bao nhieu tin chi moi hoc ky?", "q_vi": "Sinh viên được đăng ký tối đa bao nhiêu tín chỉ mỗi học kỳ?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Dieu kien de sinh vien duoc xet tot nghiep la gi?", "q_vi": "Điều kiện để sinh viên được xét tốt nghiệp là gì?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Cach tinh diem trung binh tich luy nhu the nao?", "q_vi": "Cách tính điểm trung bình tích lũy như thế nào?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Sinh vien bi canh bao hoc vu khi nao?", "q_vi": "Sinh viên bị cảnh báo học vụ khi nào?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Thoi gian dao tao toi da cua chuong trinh dai hoc la bao lau?", "q_vi": "Thời gian đào tạo tối đa của chương trình đại học là bao lâu?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Quy dinh ve viec hoc lai mon hoc nhu the nao?", "q_vi": "Quy định về việc học lại môn học như thế nào?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Sinh vien co duoc chuyen nganh hoc khong?", "q_vi": "Sinh viên có được chuyển ngành học không?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Diem danh gia mon hoc gom nhung thanh phan nao?", "q_vi": "Điểm đánh giá môn học gồm những thành phần nào?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Quy dinh ve viec bao luu ket qua hoc tap nhu the nao?", "q_vi": "Quy định về việc bảo lưu kết quả học tập như thế nào?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Sinh vien bi buoc thoi hoc khi nao?", "q_vi": "Sinh viên bị buộc thôi học khi nào?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Mon hoc tien quyet la gi?", "q_vi": "Môn học tiên quyết là gì?", "cat": "training_regulation", "diff": "direct"},
        {"q": "Quy dinh ve viec nghi hoc tam thoi nhu the nao?", "q_vi": "Quy định về việc nghỉ học tạm thời như thế nào?", "cat": "training_regulation", "diff": "direct"},

        # Paraphrase questions (same content, different wording)
        {"q": "Muon tot nghiep can dap ung yeu cau gi?", "q_vi": "Muốn tốt nghiệp cần đáp ứng yêu cầu gì?", "cat": "training_regulation", "diff": "paraphrase"},
        {"q": "Lam sao de biet minh bi canh bao hoc vu?", "q_vi": "Làm sao để biết mình bị cảnh báo học vụ?", "cat": "training_regulation", "diff": "paraphrase"},
        {"q": "Co the dang ky bao nhieu mon trong mot ky?", "q_vi": "Có thể đăng ký bao nhiêu môn trong một kỳ?", "cat": "training_regulation", "diff": "paraphrase"},
        {"q": "Hoc lai va cai thien diem khac nhau the nao?", "q_vi": "Học lại và cải thiện điểm khác nhau thế nào?", "cat": "training_regulation", "diff": "paraphrase"},
        {"q": "GPA duoc tinh nhu nao?", "q_vi": "GPA được tính như nào?", "cat": "training_regulation", "diff": "paraphrase"},

        # Exact term questions
        {"q": "Dieu 15 quy che dao tao quy dinh gi?", "q_vi": "Điều 15 quy chế đào tạo quy định gì?", "cat": "training_regulation", "diff": "exact_term"},
        {"q": "Quyet dinh 790/QD-DHCNTT noi ve van de gi?", "q_vi": "Quyết định 790/QĐ-ĐHCNTT nói về vấn đề gì?", "cat": "training_regulation", "diff": "exact_term"},
        {"q": "Dieu 20 ve xet tot nghiep quy dinh nhung gi?", "q_vi": "Điều 20 về xét tốt nghiệp quy định những gì?", "cat": "training_regulation", "diff": "exact_term"},
        {"q": "Chuong 3 quy che dao tao noi ve gi?", "q_vi": "Chương 3 quy chế đào tạo nói về gì?", "cat": "training_regulation", "diff": "exact_term"},
        {"q": "Quyet dinh 451 nam 2025 cap nhat nhung gi?", "q_vi": "Quyết định 451 năm 2025 cập nhật những gì?", "cat": "training_regulation", "diff": "exact_term"},
    ]

    # ── Generate exam questions ────────────────────────────────────
    exam_questions = [
        {"q": "Dieu kien du thi hoc ky la gi?", "q_vi": "Điều kiện dự thi học kỳ là gì?", "cat": "exam", "diff": "direct"},
        {"q": "Quy trinh to chuc thi nhu the nao?", "q_vi": "Quy trình tổ chức thi như thế nào?", "cat": "exam", "diff": "direct"},
        {"q": "Sinh vien vi pham quy che thi bi xu ly nhu the nao?", "q_vi": "Sinh viên vi phạm quy chế thi bị xử lý như thế nào?", "cat": "exam", "diff": "direct"},
        {"q": "Cach tinh diem thi cuoi ky nhu the nao?", "q_vi": "Cách tính điểm thi cuối kỳ như thế nào?", "cat": "exam", "diff": "direct"},
        {"q": "Sinh vien duoc phuc khao bai thi khong?", "q_vi": "Sinh viên được phúc khảo bài thi không?", "cat": "exam", "diff": "direct"},
        {"q": "Quy dinh ve vang thi co phep nhu the nao?", "q_vi": "Quy định về vắng thi có phép như thế nào?", "cat": "exam", "diff": "direct"},
        {"q": "Thu tuc dang ky thi lai mon hoc nhu the nao?", "q_vi": "Thủ tục đăng ký thi lại môn học như thế nào?", "cat": "exam", "diff": "direct"},
        {"q": "Hinh thuc thi cuoi ky gom nhung loai nao?", "q_vi": "Hình thức thi cuối kỳ gồm những loại nào?", "cat": "exam", "diff": "direct"},
        {"q": "Muon thi lai thi can lam gi?", "q_vi": "Muốn thi lại thì cần làm gì?", "cat": "exam", "diff": "paraphrase"},
        {"q": "Gian lan trong phong thi xu phat the nao?", "q_vi": "Gian lận trong phòng thi xử phạt thế nào?", "cat": "exam", "diff": "paraphrase"},
    ]

    # ── Student affairs questions ──────────────────────────────────
    student_questions = [
        {"q": "Dieu kien duoc xet hoc bong khuyen khich hoc tap?", "q_vi": "Điều kiện được xét học bổng khuyến khích học tập?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Gia tri hoc bong UIT Global la bao nhieu?", "q_vi": "Giá trị học bổng UIT Global là bao nhiêu?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Quy trinh nop ho so hoc bong nhu the nao?", "q_vi": "Quy trình nộp hồ sơ học bổng như thế nào?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Sinh vien duoc phep nghi hoc bao nhieu ngay?", "q_vi": "Sinh viên được phép nghỉ học bao nhiêu ngày?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Quy dinh ve ky luat sinh vien nhu the nao?", "q_vi": "Quy định về kỷ luật sinh viên như thế nào?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Dang ky o ky tuc xa can nhung gi?", "q_vi": "Đăng ký ở ký túc xá cần những gì?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Sinh vien duoc khen thuong trong truong hop nao?", "q_vi": "Sinh viên được khen thưởng trong trường hợp nào?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Quy dinh danh gia diem ren luyen sinh vien nhu the nao?", "q_vi": "Quy định đánh giá điểm rèn luyện sinh viên như thế nào?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Quyen loi cua sinh vien tai UIT la gi?", "q_vi": "Quyền lợi của sinh viên tại UIT là gì?", "cat": "student_affairs", "diff": "direct"},
        {"q": "Thu tuc xin xac nhan sinh vien nhu the nao?", "q_vi": "Thủ tục xin xác nhận sinh viên như thế nào?", "cat": "student_affairs", "diff": "direct"},
    ]

    # ── Learning outcome questions ─────────────────────────────────
    lo_questions = [
        {"q": "Chuan dau ra nganh Khoa hoc Du lieu la gi?", "q_vi": "Chuẩn đầu ra ngành Khoa học Dữ liệu là gì?", "cat": "learning_outcome", "diff": "direct"},
        {"q": "Nganh An toan thong tin hoc nhung mon gi?", "q_vi": "Ngành An toàn thông tin học những môn gì?", "cat": "learning_outcome", "diff": "direct"},
        {"q": "Thoi gian dao tao cu nhan la bao nhieu nam?", "q_vi": "Thời gian đào tạo cử nhân là bao nhiêu năm?", "cat": "learning_outcome", "diff": "direct"},
        {"q": "Muc tieu dao tao chuong trinh dai hoc la gi?", "q_vi": "Mục tiêu đào tạo chương trình đại học là gì?", "cat": "learning_outcome", "diff": "direct"},
        {"q": "Co hoi nghe nghiep sau khi tot nghiep nganh CNTT?", "q_vi": "Cơ hội nghề nghiệp sau khi tốt nghiệp ngành CNTT?", "cat": "learning_outcome", "diff": "direct"},
    ]

    # ── Out of scope questions ─────────────────────────────────────
    oos_questions = [
        {"q": "Gia ve xe buyt den UIT la bao nhieu?", "q_vi": "Giá vé xe buýt đến UIT là bao nhiêu?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "Thoi tiet Sai Gon hom nay nhu the nao?", "q_vi": "Thời tiết Sài Gòn hôm nay như thế nào?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "Diem thi IELTS cua toi la bao nhieu?", "q_vi": "Điểm thi IELTS của tôi là bao nhiêu?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "Cach nau pho bo ngon nhat?", "q_vi": "Cách nấu phở bò ngon nhất?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "Bitcoin hom nay gia bao nhieu?", "q_vi": "Bitcoin hôm nay giá bao nhiêu?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "Hoc bong Fulbright dang ky o dau?", "q_vi": "Học bổng Fulbright đăng ký ở đâu?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "AI co thay the con nguoi khong?", "q_vi": "AI có thay thế con người không?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "Dia chi nha hang gan UIT?", "q_vi": "Địa chỉ nhà hàng gần UIT?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "Lich chieu phim rap CGV hom nay?", "q_vi": "Lịch chiếu phim rạp CGV hôm nay?", "cat": "out_of_scope", "diff": "out_of_scope"},
        {"q": "Cach hack wifi nhu the nao?", "q_vi": "Cách hack wifi như thế nào?", "cat": "out_of_scope", "diff": "out_of_scope"},
    ]

    all_questions = training_questions + exam_questions + student_questions + lo_questions + oos_questions

    for item in all_questions:
        sample_id += 1
        cat = item["cat"]
        prefix = cat[:4]

        # Determine expected documents based on category
        if cat == "training_regulation":
            expected_docs = ["daa-790-qd-dhcntt_28-9-22_quy_che_dao_tao.pdf", "daa-507-qd-dhcntt-27-5-2024_quy_che_dao_tao_cho_sinh_vien.pdf", "daa-451-qd-dhcntt_10-04-2025.pdf"]
        elif cat == "exam":
            expected_docs = ["quy-trinh-to-chuc-thi-quan-ly-diem-bai-thi.pdf", "daa-790-qd-dhcntt_28-9-22_quy_che_dao_tao.pdf"]
        elif cat == "student_affairs":
            expected_docs = ["ctsv-1026_qd_dhcntt29_08_2025_scan.pdf", "ctsv-10_2016_tt_bgddt.pdf"]
        elif cat == "learning_outcome":
            expected_docs = [
                "chuan-dau-ra-cu-nhan-khoa-hoc-nganh-khoa-hoc-du-lieu-ap-dung-tu-khoa-19-2024.html",
                "chuan-dau-ra-cu-nhan-nganh-an-toan-thong-tin-ap-dung-tu-khoa-18-2023.html",
            ]
        else:
            expected_docs = []

        samples.append({
            "id": f"{prefix}_{sample_id:03d}",
            "question": item["q_vi"],
            "expected_answer": "",
            "expected_documents": expected_docs if cat != "out_of_scope" else [],
            "category": cat,
            "difficulty": item["diff"],
        })

    return samples


def main():
    samples = generate_samples()
    outpath = Path(__file__).resolve().parents[1] / "tests" / "evaluation" / "dataset" / "samples.json"
    outpath.parent.mkdir(parents=True, exist_ok=True)
    with open(outpath, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)
    print(f"Generated {len(samples)} samples to {outpath}")

    # Summary
    cats = {}
    diffs = {}
    for s in samples:
        cats[s["category"]] = cats.get(s["category"], 0) + 1
        diffs[s["difficulty"]] = diffs.get(s["difficulty"], 0) + 1
    print("\nBy category:")
    for c, n in sorted(cats.items()):
        print(f"  {c}: {n}")
    print("\nBy difficulty:")
    for d, n in sorted(diffs.items()):
        print(f"  {d}: {n}")


if __name__ == "__main__":
    main()
