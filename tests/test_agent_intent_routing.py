from src.agent.intent_routing import route_personal_read_intent


def test_routes_today_room_question_to_current_schedule() -> None:
    assert route_personal_read_intent("Phong hoc hom nay o dau?") == "get_current_schedule"


def test_routes_current_week_schedule_paraphrases() -> None:
    assert route_personal_read_intent("Tuần này tôi học môn gì?") == "get_current_schedule"
    assert route_personal_read_intent("Lịch học tuần này của tôi gồm gì?") == "get_current_schedule"


def test_routes_gpa_paraphrases() -> None:
    assert route_personal_read_intent("GPA hiện tại của tôi") == "get_grade_summary"
    assert route_personal_read_intent("Điểm trung bình tích lũy hiện tại là bao nhiêu?") == "get_grade_summary"


def test_routes_latest_grade_without_confusing_course_with_food() -> None:
    assert route_personal_read_intent("Môn mới có điểm là môn nào?") == "get_all_grades"
    assert route_personal_read_intent("Điểm môn nào vừa được cập nhật?") == "get_all_grades"


def test_does_not_force_unrelated_course_or_policy_queries() -> None:
    assert route_personal_read_intent("Hôm nay canteen có món gì?") is None
    assert route_personal_read_intent("Quy chế tính điểm môn học là gì?") == "search_university_policies"
    assert route_personal_read_intent("Quy định và cách tính GPA của UIT là gì?") == "search_university_policies"


def test_routes_exam_regulation_questions_to_rag() -> None:
    assert route_personal_read_intent("Điều kiện dự thi kết thúc học phần là gì?") == "search_university_policies"
    assert route_personal_read_intent("Quy trình tổ chức thi như thế nào?") == "search_university_policies"
