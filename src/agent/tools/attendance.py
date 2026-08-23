from __future__ import annotations

from pydantic import Field

from .base import create_input_model, create_nest_tool_class, build_nest_request
from .nest_client import NestApiClient
from .operations import ToolOperation

STUDENT = "student"
LECTURER = "lecturer"

SessionIdInput = create_input_model("SessionIdInput", {"session_id": (str, Field(min_length=1))})
QrTokenInput = create_input_model(
    "QrTokenInput",
    {
        "session_id": (str, Field(min_length=1)),
        "display_key": (str, Field(min_length=1)),
    },
)
SessionRecordsInput = create_input_model(
    "SessionRecordsInput",
    {
        "session_id": (str, Field(min_length=1)),
        "page": (int | None, Field(default=None, ge=1)),
        "limit": (int | None, Field(default=None, ge=1, le=100)),
    },
)
ClassSectionIdInput = create_input_model("AttendanceClassSectionIdInput", {"class_section_id": (str, Field(min_length=1))})
CheckinInput = create_input_model("CheckinInput", {"token": (str, Field(min_length=1))})
StartSessionInput = create_input_model(
    "StartSessionInput",
    {
        "class_section_id": (str, Field(min_length=1)),
        "duration_minutes": (int | None, Field(default=None, ge=1, le=120)),
    },
)
LecturerHistoryQueryInput = create_input_model(
    "LecturerHistoryQueryInput",
    {
        "class_section_id": (str, Field(min_length=1)),
        "date": (str | None, None),
        "page": (int | None, Field(default=None, ge=1)),
        "limit": (int | None, Field(default=None, ge=1, le=100)),
    },
)
StudentHistoryQueryInput = create_input_model(
    "StudentHistoryQueryInput",
    {
        "page": (int | None, Field(default=None, ge=1)),
        "limit": (int | None, Field(default=None, ge=1, le=100)),
    },
)

ATTENDANCE_SPECS = [
    ("GetAttendanceQrTokenTool", "get_attendance_qr_token", "Lấy QR token của một phiên điểm danh đang mở. Dùng khi giảng viên có session_id và display_key do phiên điểm danh cung cấp. Không dùng cho sinh viên check-in trực tiếp.", QrTokenInput, frozenset({LECTURER}), ToolOperation.READ, build_nest_request(method="GET", path="/attendance/session/{sessionId}/qr-token", path_params={"session_id": "sessionId"}, query_params={"display_key": "displayKey"})),
    ("GetAttendanceSessionRecordsTool", "get_attendance_session_records", "Lấy danh sách bản ghi điểm danh của một phiên. Dùng cho giảng viên khi kiểm tra kết quả điểm danh. Không dùng để export file. Dữ liệu quản lý của lớp giảng viên.", SessionRecordsInput, frozenset({LECTURER}), ToolOperation.READ, build_nest_request(method="GET", path="/attendance/session/{sessionId}/records", path_params={"session_id": "sessionId"}, query_params={"page": "page", "limit": "limit"})),
    ("GetLecturerAttendanceHistoryTool", "get_lecturer_attendance_history", "Lấy lịch sử các phiên điểm danh theo lớp mà giảng viên quản lý. Dùng khi đã biết class_section_id. Không dùng cho sinh viên. Dữ liệu quản lý giảng viên.", LecturerHistoryQueryInput, frozenset({LECTURER}), ToolOperation.READ, build_nest_request(method="GET", path="/attendance/history", query_params={"class_section_id": "classSectionId", "date": "date", "page": "page", "limit": "limit"})),
    ("GetLecturerAttendanceSectionsTool", "get_lecturer_attendance_sections", "Lấy các lớp học phần mà giảng viên có thể quản lý điểm danh. Dùng trước khi mở điểm danh. Không dùng cho sinh viên. Dữ liệu quản lý giảng viên.", create_input_model("LecturerAttendanceSectionsInput", {}), frozenset({LECTURER}), ToolOperation.READ, build_nest_request(method="GET", path="/attendance/lecturer/class-sections")),
    ("GetClassSectionStudentsTool", "get_class_section_students", "Lấy danh sách sinh viên của một lớp học phần. Dùng khi giảng viên cần xem roster điểm danh. Không dùng nếu chưa có class_section_id. Dữ liệu quản lý lớp học.", ClassSectionIdInput, frozenset({LECTURER}), ToolOperation.READ, build_nest_request(method="GET", path="/attendance/class-sections/{classSectionId}/students", path_params={"class_section_id": "classSectionId"})),
    ("GetAttendanceSessionSummaryTool", "get_attendance_session_summary", "Lấy tóm tắt phiên điểm danh theo lớp học phần. Dùng khi giảng viên cần số liệu tổng hợp. Không dùng cho check-in. Dữ liệu quản lý lớp học.", ClassSectionIdInput, frozenset({LECTURER}), ToolOperation.READ, build_nest_request(method="GET", path="/attendance/class-sections/{classSectionId}/session-summary", path_params={"class_section_id": "classSectionId"})),
    ("GetMyAttendanceHistoryTool", "get_my_attendance_history", "Lấy lịch sử điểm danh của sinh viên hiện tại. Dùng khi sinh viên hỏi tình trạng chuyên cần. Không dùng cho lớp người khác. Dữ liệu thuộc người dùng hiện tại.", StudentHistoryQueryInput, frozenset({STUDENT}), ToolOperation.READ, build_nest_request(method="GET", path="/attendance/me/history", query_params={"page": "page", "limit": "limit"})),
    ("StartAttendanceSessionTool", "start_attendance_session", "Mở một phiên điểm danh cho lớp học phần. Dùng khi giảng viên bắt đầu buổi học và đã có class_section_id. Không dùng nếu chỉ hỏi lịch sử điểm danh. Dữ liệu quản lý lớp học.", StartSessionInput, frozenset({LECTURER}), ToolOperation.CREATE, build_nest_request(method="POST", path="/attendance/session/start")),
    ("StopAttendanceSessionTool", "stop_attendance_session", "Đóng một phiên điểm danh đang mở. Dùng khi giảng viên kết thúc phiên điểm danh. Không dùng cho truy vấn thông tin. Dữ liệu quản lý lớp học.", SessionIdInput, frozenset({LECTURER}), ToolOperation.UPDATE, build_nest_request(method="POST", path="/attendance/session/{sessionId}/stop", path_params={"session_id": "sessionId"})),
    ("CheckinAttendanceTool", "checkin_attendance", "Thực hiện check-in điểm danh cho sinh viên hiện tại bằng token. Dùng khi sinh viên xác nhận có mặt trong phiên đang mở. Không dùng để lấy lịch sử điểm danh. Dữ liệu thuộc người dùng hiện tại.", CheckinInput, frozenset({STUDENT}), ToolOperation.EMERGENCY, build_nest_request(method="POST", path="/attendance/checkin")),
]


def build_attendance_tools(nest_client: NestApiClient) -> list:
    tools = []
    for class_name, name, description, input_model, roles, operation, request_builder in ATTENDANCE_SPECS:
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
