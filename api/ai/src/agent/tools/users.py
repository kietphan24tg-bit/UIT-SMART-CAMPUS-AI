from __future__ import annotations

from typing import Any

from pydantic import Field

from .base import create_input_model, create_nest_tool_class, build_nest_request
from .nest_client import NestApiClient
from .operations import ToolOperation

STUDENT = "student"
LECTURER = "lecturer"
ADMIN = "admin"
SUPER_ADMIN = "super_admin"

USER_ROLES = frozenset({STUDENT, LECTURER, ADMIN, SUPER_ADMIN})
ADMIN_ROLES = frozenset({ADMIN, SUPER_ADMIN})

UserIdInput = create_input_model("UserIdInput", {"user_id": (str, Field(min_length=1))})
SearchInput = create_input_model(
    "UserSearchInput",
    {"query": (str | None, None), "page": (int | None, None), "limit": (int | None, None)},
)
ProfileUpdateInput = create_input_model(
    "ProfileUpdateInput",
    {"payload": (dict[str, Any], Field(default_factory=dict, min_length=1))},
)
RoleUpdateInput = create_input_model(
    "RoleUpdateInput",
    {"user_id": (str, Field(min_length=1)), "role": (str, Field(min_length=1))},
)
ActiveStatusInput = create_input_model(
    "ActiveStatusInput",
    {"user_id": (str, Field(min_length=1)), "is_active": (bool, ...)},
)
StudyMaterialUpdateInput = create_input_model(
    "StudyMaterialUpdateInput",
    {"id": (str, Field(min_length=1)), "payload": (dict[str, Any], Field(default_factory=dict, min_length=1))},
)


USER_SPECS = [
    ("GetMyProfileTool", "get_my_profile", "Lấy hồ sơ của người dùng hiện tại. Dùng khi cần thông tin cá nhân cơ bản. Không dùng cho quản trị danh sách người dùng. Dữ liệu thuộc người dùng hiện tại.", create_input_model("GetMyProfileInput", {}), USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/users/me")),
    ("ListUsersTool", "list_users", "Liệt kê người dùng cho màn hình quản trị. Dùng cho admin hoặc super admin khi tìm kiếm tài khoản. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", SearchInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/users", query_params={"query": "query", "page": "page", "limit": "limit"})),
    ("GetUserTool", "get_user", "Lấy chi tiết một người dùng theo user_id. Dùng cho admin khi cần xem hồ sơ người khác. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", UserIdInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/users/{userId}", path_params={"user_id": "userId"})),
    ("SearchStudyMaterialsTool", "search_study_materials", "Tìm kiếm tài liệu học tập theo từ khóa. Dùng khi người dùng hỏi file học liệu, slide hoặc đề cương. Không dùng để upload tài liệu mới. Dữ liệu công khai nội bộ theo quyền xem.", SearchInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/study-materials", query_params={"query": "query", "page": "page", "limit": "limit"})),
    ("UpdateMyProfileTool", "update_my_profile", "Cập nhật hồ sơ của người dùng hiện tại bằng payload nghiệp vụ. Dùng khi cần sửa thông tin cá nhân. Không dùng cho avatar upload. Dữ liệu thuộc người dùng hiện tại.", ProfileUpdateInput, USER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/users/me", body_field="payload")),
    ("UpdateUserRoleTool", "update_user_role", "Cập nhật role của một người dùng theo user_id. Dùng cho admin hoặc super admin. Không dùng cho người dùng tự đổi quyền. Dữ liệu quản trị.", RoleUpdateInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/users/{userId}/role", path_params={"user_id": "userId"}, body_params={"role": "role"})),
    ("UpdateUserActiveStatusTool", "update_user_active_status", "Bật hoặc tắt trạng thái hoạt động của một người dùng. Dùng cho admin quản trị tài khoản. Không dùng cho chỉnh hồ sơ cá nhân. Dữ liệu quản trị.", ActiveStatusInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/users/{userId}/active", path_params={"user_id": "userId"}, body_params={"is_active": "isActive"})),
    ("DeleteUserTool", "delete_user", "Xóa một người dùng theo user_id. Dùng cho admin hoặc super admin trong nghiệp vụ quản trị tài khoản. Không dùng cho người dùng tự xóa tài khoản tại đây. Dữ liệu quản trị.", UserIdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/users/{userId}", path_params={"user_id": "userId"})),
    ("UpdateStudyMaterialMetadataTool", "update_study_material_metadata", "Cập nhật metadata của tài liệu học tập theo id và payload. Dùng cho chủ sở hữu hoặc admin khi cần sửa tiêu đề, mô tả hoặc phân loại. Không dùng để upload file nhị phân mới. Dữ liệu của người dùng hiện tại hoặc quản trị.", StudyMaterialUpdateInput, USER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/study-materials/{id}", path_params={"id": "id"}, body_field="payload")),
    ("DeleteStudyMaterialTool", "delete_study_material", "Xóa một tài liệu học tập theo id. Dùng cho chủ sở hữu hoặc admin. Không dùng để chỉ tra cứu học liệu. Dữ liệu của người dùng hiện tại hoặc quản trị.", create_input_model("DeleteStudyMaterialInput", {"id": (str, Field(min_length=1))}), USER_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/study-materials/{id}", path_params={"id": "id"})),
]


def build_user_tools(nest_client: NestApiClient) -> list:
    tools = []
    for class_name, name, description, input_model, roles, operation, request_builder in USER_SPECS:
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
