from __future__ import annotations

import re
import unicodedata


def _normalize_vietnamese(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.replace("đ", "d").replace("Đ", "D"))
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"\s+", " ", ascii_text).strip()


def route_personal_read_intent(message: str) -> str | None:
    """Return the mandatory read tool for high-confidence personal intents."""

    text = _normalize_vietnamese(message)

    policy_phrases = (
        "quy che",
        "quy dinh",
        "dieu kien du thi",
        "duoc du thi",
        "du thi ket thuc hoc phan",
        "thi ket thuc hoc phan",
        "to chuc thi",
        "quy trinh thi",
        "cong thuc",
        "cach tinh",
    )
    if any(phrase in text for phrase in policy_phrases):
        return "search_university_policies"

    if "gpa" in text or "diem trung binh tich luy" in text:
        return "get_grade_summary"

    asks_current_time = any(phrase in text for phrase in ("hom nay", "tuan nay", "hien tai"))
    asks_schedule = any(
        phrase in text
        for phrase in ("lich hoc", "thoi khoa bieu", "toi hoc mon gi", "hoc mon gi", "phong hoc")
    )
    if asks_current_time and asks_schedule:
        return "get_current_schedule"

    asks_for_latest = any(phrase in text for phrase in ("moi co", "moi nhat", "vua co", "vua duoc", "cap nhat"))
    if "diem" in text and asks_for_latest and ("mon" in text or "hoc phan" in text):
        return "get_all_grades"

    return None
