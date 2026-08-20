from __future__ import annotations

from typing import Any

from pydantic import Field

from .base import PayloadInput, create_input_model, create_nest_tool_class, build_nest_request
from .nest_client import NestApiClient
from .operations import ToolOperation

STUDENT = "student"
LECTURER = "lecturer"
ADMIN = "admin"
SUPER_ADMIN = "super_admin"

STUDENT_ROLES = frozenset({STUDENT})
LECTURER_ROLES = frozenset({LECTURER})
ADMIN_ROLES = frozenset({ADMIN, SUPER_ADMIN})
ACADEMIC_VIEW_ROLES = frozenset({STUDENT, LECTURER, ADMIN, SUPER_ADMIN})


SemesterInput = create_input_model("SemesterInput", {"semester_id": (str, Field(min_length=1))})
RegistrationIdInput = create_input_model("RegistrationIdInput", {"registration_id": (str, Field(min_length=1))})
ClassSectionIdInput = create_input_model("ClassSectionIdInput", {"class_section_id": (str, Field(min_length=1))})
OptionalSemesterSearchInput = create_input_model(
    "OptionalSemesterSearchInput",
    {
        "semester_id": (str | None, None),
        "query": (str | None, None),
        "page": (int | None, None),
        "limit": (int | None, None),
    },
)
GradeWeightUpdateInput = create_input_model(
    "GradeWeightUpdateInput",
    {
        "class_section_id": (str, Field(min_length=1)),
        "payload": (dict[str, Any], Field(default_factory=dict, min_length=1)),
    },
)
GradeSheetUpdateInput = create_input_model(
    "GradeSheetUpdateInput",
    {
        "class_section_id": (str, Field(min_length=1)),
        "payload": (dict[str, Any], Field(default_factory=dict, min_length=1)),
    },
)
CoursePayloadInput = create_input_model(
    "CoursePayloadInput",
    {"payload": (dict[str, Any], Field(default_factory=dict, min_length=1))},
)
ClassSectionPayloadInput = create_input_model(
    "ClassSectionPayloadInput",
    {
        "class_section_id": (str | None, None),
        "payload": (dict[str, Any], Field(default_factory=dict, min_length=1)),
    },
)


ACADEMIC_SPECS = [
    ("GetAllSchedulesTool", "get_all_schedules", "Lấy toàn bộ thời khóa biểu của người dùng hiện tại trên các học kỳ khả dụng. Dùng khi cần xem lịch học hoặc lịch dạy tổng quát. Không dùng để tra cứu quy chế. Dữ liệu thuộc người dùng hiện tại.", OptionalSemesterSearchInput, ACADEMIC_VIEW_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/schedules", query_params={"semester_id": "semesterId", "query": "query", "page": "page", "limit": "limit"})),
    ("GetCurrentScheduleTool", "get_current_schedule", "Lấy thời khóa biểu của học kỳ hiện tại cho người dùng hiện tại. Dùng khi người dùng hỏi lịch học hoặc lịch dạy hiện tại. Không dùng để tra cứu lịch thi. Dữ liệu thuộc người dùng hiện tại.", create_input_model("CurrentScheduleInput", {}), ACADEMIC_VIEW_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/schedules/current")),
    ("GetSemesterScheduleTool", "get_semester_schedule", "Lấy thời khóa biểu theo một học kỳ cụ thể. Dùng khi câu hỏi nêu rõ học kỳ. Không dùng nếu chưa có semester_id. Dữ liệu thuộc người dùng hiện tại.", SemesterInput, ACADEMIC_VIEW_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/schedules/semesters/{semesterId}", path_params={"semester_id": "semesterId"})),
    ("GetAllGradesTool", "get_all_grades", "Lấy toàn bộ điểm của người dùng hiện tại. Dùng khi người dùng hỏi điểm tổng thể. Không dùng cho cập nhật điểm. Dữ liệu thuộc người dùng hiện tại.", create_input_model("AllGradesInput", {}), ACADEMIC_VIEW_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/grades")),
    ("GetGradeSummaryTool", "get_grade_summary", "Lấy tóm tắt điểm, GPA hoặc thống kê học tập của người dùng hiện tại. Dùng khi cần nhìn tổng quan. Không dùng để sửa điểm. Dữ liệu thuộc người dùng hiện tại.", create_input_model("GradeSummaryInput", {}), ACADEMIC_VIEW_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/grades/summary")),
    ("GetCurrentGradesTool", "get_current_grades", "Lấy điểm của học kỳ hiện tại. Dùng khi câu hỏi nhắm vào kỳ đang học. Không dùng khi cần điểm tất cả học kỳ. Dữ liệu thuộc người dùng hiện tại.", create_input_model("CurrentGradesInput", {}), ACADEMIC_VIEW_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/grades/current")),
    ("GetSemesterGradesTool", "get_semester_grades", "Lấy điểm theo học kỳ cụ thể. Dùng khi người dùng nêu semester_id. Không dùng nếu học kỳ chưa rõ. Dữ liệu thuộc người dùng hiện tại.", SemesterInput, ACADEMIC_VIEW_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/grades/semesters/{semesterId}", path_params={"semester_id": "semesterId"})),
    ("GetAvailableClassSectionsTool", "get_available_class_sections", "Lấy danh sách lớp học phần có thể đăng ký. Dùng trước khi đăng ký môn. Không dùng để xác nhận đã đăng ký thành công. Dữ liệu là danh sách học vụ cho người dùng hiện tại.", OptionalSemesterSearchInput, STUDENT_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/registrations/available-class-sections", query_params={"semester_id": "semesterId", "query": "query", "page": "page", "limit": "limit"})),
    ("GetMyRegistrationsTool", "get_my_registrations", "Lấy các đăng ký môn hiện tại của sinh viên. Dùng khi hỏi đã đăng ký những lớp nào. Không dùng để đăng ký hoặc hủy. Dữ liệu thuộc người dùng hiện tại.", create_input_model("MyRegistrationsInput", {}), STUDENT_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/registrations/me")),
    ("RegisterClassSectionTool", "register_class_section", "Đăng ký một lớp học phần cho sinh viên hiện tại. Dùng khi người dùng yêu cầu đăng ký và đã có class_section_id. Không dùng nếu chỉ hỏi thông tin tham khảo. Dữ liệu thao tác trên hồ sơ người dùng hiện tại.", ClassSectionIdInput, STUDENT_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/registrations", body_params={"class_section_id": "classSectionId"})),
    ("DropRegistrationTool", "drop_registration", "Hủy một đăng ký môn học hiện có. Dùng khi người dùng muốn rút đăng ký và đã có registration_id. Không dùng để xem danh sách môn. Dữ liệu thao tác trên hồ sơ người dùng hiện tại.", RegistrationIdInput, STUDENT_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/registrations/{registrationId}/drop", path_params={"registration_id": "registrationId"})),
    ("GetLecturerGradeSectionsTool", "get_lecturer_grade_sections", "Lấy danh sách lớp học phần mà giảng viên có thể quản lý điểm. Dùng cho giảng viên khi chuẩn bị nhập hoặc xem điểm. Không dùng cho sinh viên. Dữ liệu quản lý của giảng viên hiện tại.", OptionalSemesterSearchInput, LECTURER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/grades/lecturer/class-sections", query_params={"semester_id": "semesterId", "query": "query", "page": "page", "limit": "limit"})),
    ("GetClassGradeSheetTool", "get_class_grade_sheet", "Lấy bảng điểm chi tiết của một lớp học phần. Dùng khi giảng viên cần xem bảng điểm theo lớp. Không dùng nếu chưa có class_section_id. Dữ liệu quản lý theo lớp giảng viên.", ClassSectionIdInput, LECTURER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/grades/class-sections/{classSectionId}/sheet", path_params={"class_section_id": "classSectionId"})),
    ("UpdateGradeWeightsTool", "update_grade_weights", "Cập nhật cơ cấu trọng số điểm cho một lớp học phần. Dùng khi giảng viên quản lý điểm và đã có payload hợp lệ. Không dùng chỉ để xem điểm. Dữ liệu quản trị theo lớp giảng viên.", GradeWeightUpdateInput, LECTURER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PUT", path="/grades/class-sections/{classSectionId}/weights", path_params={"class_section_id": "classSectionId"}, body_field="payload")),
    ("UpdateGradeSheetTool", "update_grade_sheet", "Cập nhật bảng điểm của một lớp học phần. Dùng khi giảng viên nhập hoặc sửa điểm và đã có payload hợp lệ. Không dùng để tra cứu thông tin. Dữ liệu quản trị theo lớp giảng viên.", GradeSheetUpdateInput, LECTURER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PUT", path="/grades/class-sections/{classSectionId}/sheet", path_params={"class_section_id": "classSectionId"}, body_field="payload")),
    ("ListSemestersTool", "list_semesters", "Liệt kê học kỳ trong catalog học vụ. Dùng cho màn hình quản trị hoặc tra cứu danh mục. Không dùng cho thao tác cá nhân hóa. Dữ liệu quản trị.", OptionalSemesterSearchInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/catalog/semesters", query_params={"query": "query", "page": "page", "limit": "limit"})),
    ("ListCoursesTool", "list_courses", "Liệt kê học phần trong catalog. Dùng cho quản trị học vụ hoặc lọc môn học. Không dùng để lấy điểm cá nhân. Dữ liệu quản trị.", OptionalSemesterSearchInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/catalog/courses", query_params={"query": "query", "page": "page", "limit": "limit"})),
    ("ListLecturersTool", "list_lecturers", "Liệt kê giảng viên trong catalog. Dùng cho màn hình quản trị mở lớp hoặc phân công. Không dùng cho dữ liệu sinh viên cá nhân. Dữ liệu quản trị.", OptionalSemesterSearchInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/catalog/lecturers", query_params={"query": "query", "page": "page", "limit": "limit"})),
    ("ListClassSectionsTool", "list_class_sections", "Liệt kê lớp học phần trong catalog. Dùng cho quản trị mở lớp hoặc lịch. Không dùng để đăng ký trực tiếp. Dữ liệu quản trị.", OptionalSemesterSearchInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/catalog/class-sections", query_params={"semester_id": "semesterId", "query": "query", "page": "page", "limit": "limit"})),
    ("CreateOrUpdateCourseTool", "create_or_update_course", "Tạo hoặc cập nhật thông tin học phần trong catalog bằng payload nghiệp vụ. Dùng cho quản trị catalog. Không dùng cho câu hỏi tra cứu đơn thuần. Dữ liệu quản trị.", CoursePayloadInput, ADMIN_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/catalog/courses", body_field="payload")),
    ("CreateClassSectionTool", "create_class_section", "Tạo lớp học phần mới bằng payload nghiệp vụ. Dùng cho quản trị đào tạo khi đã đủ thông tin mở lớp. Không dùng để chỉ xem danh sách lớp. Dữ liệu quản trị.", CoursePayloadInput, ADMIN_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/catalog/class-sections", body_field="payload")),
    ("UpdateClassSectionTool", "update_class_section", "Cập nhật lớp học phần hiện có bằng class_section_id và payload nghiệp vụ. Dùng cho quản trị đào tạo. Không dùng nếu chỉ hỏi thông tin lớp. Dữ liệu quản trị.", create_input_model("UpdateClassSectionInput", {"class_section_id": (str, Field(min_length=1)), "payload": (dict[str, Any], Field(default_factory=dict, min_length=1))}), ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/catalog/class-sections/{classSectionId}", path_params={"class_section_id": "classSectionId"}, body_field="payload")),
    ("ReplaceClassMeetingsTool", "replace_class_meetings", "Thay thế danh sách buổi học của một lớp học phần bằng payload nghiệp vụ. Dùng khi điều chỉnh lịch chi tiết. Không dùng cho tra cứu lịch cá nhân. Dữ liệu quản trị.", create_input_model("ReplaceClassMeetingsInput", {"class_section_id": (str, Field(min_length=1)), "payload": (dict[str, Any], Field(default_factory=dict, min_length=1))}), ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/catalog/class-sections/{classSectionId}/meetings", path_params={"class_section_id": "classSectionId"}, body_field="payload")),
]


def build_academic_tools(nest_client: NestApiClient) -> list:
    tools = []
    for class_name, name, description, input_model, roles, operation, request_builder in ACADEMIC_SPECS:
        tool_class = create_nest_tool_class(
            class_name=class_name,
            name=name,
            description=description,
            input_model=input_model,
            allowed_roles=roles,
            operation_type=operation,
            request_builder=request_builder,
        )
        tools.append(tool_class(nest_client))
    return tools
