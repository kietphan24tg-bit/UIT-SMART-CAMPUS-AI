from __future__ import annotations

from typing import Any, Literal

from pydantic import Field

from .base import create_input_model, create_nest_tool_class, build_nest_request
from .nest_client import NestApiClient
from .operations import ToolOperation

STUDENT = "student"
LECTURER = "lecturer"
ADMIN = "admin"
SUPER_ADMIN = "super_admin"
CANTEEN_ADMIN = "canteen_admin"

USER_ROLES = frozenset({STUDENT, LECTURER, ADMIN, SUPER_ADMIN, CANTEEN_ADMIN})
MEMBER_ROLES = frozenset({STUDENT, LECTURER})
LIBRARY_REQUEST_VIEW_ROLES = frozenset({STUDENT, LECTURER, ADMIN, SUPER_ADMIN})
ADMIN_ROLES = frozenset({ADMIN, SUPER_ADMIN})
CANTEEN_ADMIN_ROLES = frozenset({CANTEEN_ADMIN, ADMIN, SUPER_ADMIN})
NOTIFICATION_AUTHOR_ROLES = frozenset({LECTURER, ADMIN, SUPER_ADMIN})
STUDENT_ONLY = frozenset({STUDENT})

IdInput = create_input_model("CampusIdInput", {"id": (str, Field(min_length=1))})
BookIdInput = create_input_model("BookIdInput", {"book_id": (str, Field(min_length=1))})
VehicleIdInput = create_input_model("VehicleIdInput", {"vehicle_id": (str, Field(min_length=1))})
RoomCodeInput = create_input_model("RoomCodeInput", {"room_code": (str, Field(min_length=1))})
BuildingCodeInput = create_input_model("BuildingCodeInput", {"building_code": (str, Field(min_length=1))})
SlugInput = create_input_model("SlugInput", {"slug": (str, Field(min_length=1))})
NoServiceArguments = create_input_model("NoServiceArguments", {})
PaginationInput = create_input_model(
    "PaginationInput",
    {
        "page": (int | None, Field(default=None, ge=1)),
        "limit": (int | None, Field(default=None, ge=1, le=100)),
    },
)
EventPaginationInput = create_input_model(
    "EventPaginationInput",
    {
        "page": (int | None, Field(default=None, ge=1)),
        "limit": (int | None, Field(default=None, ge=1, le=50)),
    },
)
CanteenAdminCatalogInput = create_input_model(
    "CanteenAdminCatalogInput",
    {"include_inactive": (bool | None, None)},
)
LibraryBookSearchInput = create_input_model(
    "LibraryBookSearchInput",
    {
        "query": (str | None, None),
        "subject": (str | None, None),
        "page": (int | None, Field(default=None, ge=1)),
        "limit": (int | None, Field(default=None, ge=1)),
    },
)
LoanRequestQueryInput = create_input_model(
    "LoanRequestQueryInput",
    {"status": (Literal["pending", "approved", "rejected", "cancelled"] | None, None)},
)
OrderInput = create_input_model(
    "OrderInput",
    {"payload": (dict[str, Any], Field(default_factory=dict, min_length=1))},
)
EntityPayloadInput = create_input_model(
    "EntityPayloadInput",
    {
        "id": (str, Field(min_length=1)),
        "payload": (dict[str, Any], Field(default_factory=dict, min_length=1)),
    },
)
BuildingRoomInput = create_input_model(
    "BuildingRoomInput",
    {
        "building_code": (str, Field(min_length=1)),
        "floor_number": (int | None, Field(default=None, ge=1)),
        "min_capacity": (int | None, Field(default=None, ge=1)),
    },
)
RoomScheduleInput = create_input_model(
    "RoomScheduleInput",
    {
        "room_code": (str, Field(min_length=1)),
        "week_start": (str | None, None),
    },
)
RoomRequestSlotInput = create_input_model(
    "RoomRequestSlotInput",
    {
        "room_code": (str, Field(min_length=1)),
        "date": (str, Field(min_length=1)),
        "time_slot_id": (str, Field(min_length=1)),
    },
)
RoomBookingQueryInput = create_input_model(
    "RoomBookingQueryInput",
    {
        "status": (
            Literal["pending", "approved", "booked", "maintenance", "rejected", "cancelled"] | None,
            None,
        )
    },
)
RoomCodeStatusInput = create_input_model(
    "RoomCodeStatusInput",
    {
        "room_code": (str, Field(min_length=1)),
        "status": (
            Literal["pending", "approved", "booked", "maintenance", "rejected", "cancelled"] | None,
            None,
        ),
    },
)
DeleteNotificationsInput = create_input_model(
    "DeleteNotificationsInput",
    {
        "category": (Literal["general", "academic", "payment", "emergency"] | None, None),
        "unread_only": (bool | None, None),
    },
)
ParkingStatusInput = create_input_model("ParkingStatusInput", {"gate_id": (str | None, None)})
TelemetryQueryInput = create_input_model("TelemetryQueryInput", {"gate_id": (str | None, None)})
VehiclePayloadInput = create_input_model("VehiclePayloadInput", {"payload": (dict[str, Any], Field(default_factory=dict, min_length=1))})
SosRouteInput = create_input_model(
    "SosRouteInput",
    {
        "sos_id": (str, Field(min_length=1)),
        "from_lat": (float, Field(ge=-90, le=90)),
        "from_lng": (float, Field(ge=-180, le=180)),
    },
)
SosIdInput = create_input_model("SosIdInput", {"sos_id": (str, Field(min_length=1))})
FireAlertIdInput = create_input_model("FireAlertIdInput", {"alert_id": (str, Field(min_length=1))})
ReservationInput = create_input_model("ReservationInput", {"book_id": (str, Field(min_length=1))})


CAMPUS_SERVICE_SPECS = [
    ("GetCanteenCatalogTool", "get_canteen_catalog", "Lấy catalog canteen công khai cho người dùng hiện tại. Dùng khi cần xem danh mục sản phẩm. Không dùng cho quản trị đơn hàng. Dữ liệu công khai theo canteen.", NoServiceArguments, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/canteen/catalog")),
    ("GetAdminCanteenCatalogTool", "get_admin_canteen_catalog", "Lấy catalog canteen ở chế độ quản trị. Dùng cho canteen admin hoặc admin khi cần xem đủ trạng thái danh mục. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", CanteenAdminCatalogInput, CANTEEN_ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/canteen/catalog/admin", query_params={"include_inactive": "includeInactive"})),
    ("GetMyCanteenOrdersTool", "get_my_canteen_orders", "Lấy đơn hàng canteen của người dùng hiện tại. Dùng khi người dùng hỏi món đã đặt. Không dùng cho hàng đợi vận hành. Dữ liệu thuộc người dùng hiện tại.", NoServiceArguments, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/canteen/orders/me")),
    ("GetAdminCanteenOrdersTool", "get_admin_canteen_orders", "Lấy đơn hàng canteen ở góc nhìn quản trị. Dùng cho vận hành canteen hoặc admin. Không dùng cho sinh viên xem đơn cá nhân. Dữ liệu quản trị.", NoServiceArguments, CANTEEN_ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/canteen/orders/admin")),
    ("CreateCanteenOrderTool", "create_canteen_order", "Tạo đơn hàng canteen mới bằng payload nghiệp vụ. Dùng khi người dùng đã chọn món và muốn đặt hàng. Không dùng để chỉ xem catalog. Dữ liệu thao tác trên tài khoản hiện tại.", OrderInput, MEMBER_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/canteen/orders", body_field="payload")),
    ("CancelCanteenOrderTool", "cancel_canteen_order", "Hủy đơn hàng canteen của người dùng hiện tại. Dùng khi cần hủy đơn trước khi xử lý xong. Không dùng cho đơn của người khác. Dữ liệu thuộc người dùng hiện tại.", IdInput, MEMBER_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/canteen/orders/{id}", path_params={"id": "id"})),
    ("DeleteAdminCanteenOrderTool", "delete_admin_canteen_order", "Xóa đơn hàng canteen ở phía quản trị. Dùng cho vận hành khi cần dọn dữ liệu nghiệp vụ hợp lệ. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", IdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/canteen/orders/admin/{id}", path_params={"id": "id"})),
    ("CompleteCanteenOrderTool", "complete_canteen_order", "Đánh dấu đơn hàng canteen đã hoàn tất. Dùng cho vận hành khi đơn được giao xong. Không dùng để tạo thanh toán. Dữ liệu quản trị.", IdInput, CANTEEN_ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/canteen/orders/{id}/complete", path_params={"id": "id"})),
    ("CreateCanteenMomoPaymentTool", "create_canteen_momo_payment", "Tạo yêu cầu thanh toán MoMo cho một đơn canteen. Dùng khi người dùng chuẩn bị thanh toán đơn hiện có. Không dùng cho webhook hay return URL. Dữ liệu thuộc người dùng hiện tại.", IdInput, MEMBER_ROLES, ToolOperation.PAYMENT, build_nest_request(method="POST", path="/canteen/orders/{id}/pay", path_params={"id": "id"})),
    ("CreateCanteenSepayPaymentTool", "create_canteen_sepay_payment", "Tạo yêu cầu thanh toán SePay cho một đơn canteen. Dùng khi người dùng chọn SePay. Không dùng cho webhook. Dữ liệu thuộc người dùng hiện tại.", IdInput, MEMBER_ROLES, ToolOperation.PAYMENT, build_nest_request(method="POST", path="/canteen/orders/{id}/pay/sepay", path_params={"id": "id"})),
    ("CreateCanteenCategoryTool", "create_canteen_category", "Tạo danh mục canteen mới bằng payload nghiệp vụ. Dùng cho canteen admin hoặc admin. Không dùng để xem catalog. Dữ liệu quản trị.", OrderInput, CANTEEN_ADMIN_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/canteen/categories", body_field="payload")),
    ("UpdateCanteenCategoryTool", "update_canteen_category", "Cập nhật danh mục canteen bằng id và payload. Dùng cho quản trị sản phẩm. Không dùng nếu chỉ tra cứu thông tin. Dữ liệu quản trị.", EntityPayloadInput, CANTEEN_ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/canteen/categories/{id}", path_params={"id": "id"}, body_field="payload")),
    ("DisableCanteenCategoryTool", "disable_canteen_category", "Vô hiệu hóa danh mục canteen theo id. Dùng khi không muốn hiển thị danh mục nữa. Không dùng cho khôi phục. Dữ liệu quản trị.", IdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/canteen/categories/{id}", path_params={"id": "id"})),
    ("CreateCanteenProductTool", "create_canteen_product", "Tạo sản phẩm canteen mới bằng payload nghiệp vụ. Dùng cho vận hành menu. Không dùng cho upload ảnh. Dữ liệu quản trị.", OrderInput, CANTEEN_ADMIN_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/canteen/products", body_field="payload")),
    ("UpdateCanteenProductTool", "update_canteen_product", "Cập nhật sản phẩm canteen bằng id và payload. Dùng cho vận hành menu. Không dùng cho upload ảnh sản phẩm. Dữ liệu quản trị.", EntityPayloadInput, CANTEEN_ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/canteen/products/{id}", path_params={"id": "id"}, body_field="payload")),
    ("DisableCanteenProductTool", "disable_canteen_product", "Vô hiệu hóa sản phẩm canteen theo id. Dùng khi sản phẩm không còn bán. Không dùng nếu chỉ muốn xem thông tin sản phẩm. Dữ liệu quản trị.", IdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/canteen/products/{id}", path_params={"id": "id"})),
    ("SearchLibraryBooksTool", "search_library_books", "Tìm kiếm sách thư viện. Dùng khi người dùng cần tra cứu đầu sách theo từ khóa hoặc chủ đề. Không dùng cho thao tác mượn hoặc duyệt phiếu. Dữ liệu công khai của thư viện.", LibraryBookSearchInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/books", query_params={"query": "q", "subject": "subject", "page": "page", "limit": "limit"})),
    ("GetLibraryBookTool", "get_library_book", "Lấy chi tiết một đầu sách thư viện theo book_id. Dùng khi người dùng đã xác định sách cụ thể. Không dùng cho danh sách nhiều sách. Dữ liệu công khai thư viện.", BookIdInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/books/{bookId}", path_params={"book_id": "bookId"})),
    ("GetMyLibraryLoansTool", "get_my_library_loans", "Lấy các khoản mượn sách của người dùng hiện tại. Dùng khi hỏi đang mượn sách gì. Không dùng cho quản trị thư viện. Dữ liệu thuộc người dùng hiện tại.", NoServiceArguments, MEMBER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/me/loans")),
    ("GetMyLoanRequestsTool", "get_my_loan_requests", "Lấy các yêu cầu mượn sách của người dùng hiện tại, có thể lọc theo trạng thái. Không dùng cho phê duyệt quản trị. Dữ liệu thuộc người dùng hiện tại.", LoanRequestQueryInput, MEMBER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/me/loan-requests", query_params={"status": "status"})),
    ("GetLoanRequestTool", "get_loan_request", "Lấy chi tiết một yêu cầu mượn sách theo id. Dùng khi người dùng hoặc quản trị cần xem hồ sơ cụ thể. Không dùng nếu chưa có request id. Dữ liệu của người dùng hiện tại hoặc quản trị.", IdInput, LIBRARY_REQUEST_VIEW_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/loan-requests/{id}", path_params={"id": "id"})),
    ("GetMyReservationsTool", "get_my_reservations", "Lấy danh sách đặt trước sách của người dùng hiện tại. Dùng khi hỏi các reservation hiện có. Không dùng cho thao tác phê duyệt. Dữ liệu thuộc người dùng hiện tại.", NoServiceArguments, MEMBER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/me/reservations")),
    ("GetAdminLibraryBooksTool", "get_admin_library_books", "Lấy danh sách sách thư viện ở chế độ quản trị. Dùng cho admin. Không dùng cho tra cứu cơ bản. Dữ liệu quản trị thư viện.", NoServiceArguments, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/admin/books")),
    ("GetAdminLoanRequestsTool", "get_admin_loan_requests", "Lấy các yêu cầu mượn sách ở góc nhìn quản trị, có thể lọc theo trạng thái. Không dùng cho người dùng phổ thông. Dữ liệu quản trị thư viện.", LoanRequestQueryInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/admin/loan-requests", query_params={"status": "status"})),
    ("GetAdminLibraryLoansTool", "get_admin_library_loans", "Lấy danh sách khoản mượn sách ở góc nhìn quản trị. Dùng cho admin. Không dùng cho người dùng phổ thông. Dữ liệu quản trị thư viện.", NoServiceArguments, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/library/admin/loans")),
    ("CreateLoanRequestTool", "create_loan_request", "Tạo yêu cầu mượn sách mới bằng payload nghiệp vụ. Dùng khi người dùng muốn gửi yêu cầu mượn. Không dùng cho phê duyệt yêu cầu. Dữ liệu thuộc người dùng hiện tại.", OrderInput, MEMBER_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/library/loan-requests", body_field="payload")),
    ("CancelLoanRequestTool", "cancel_loan_request", "Hủy yêu cầu mượn sách hiện có. Dùng khi người dùng không muốn tiếp tục yêu cầu. Không dùng để xóa dữ liệu quản trị. Dữ liệu thuộc người dùng hiện tại.", IdInput, MEMBER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/loan-requests/{id}/cancel", path_params={"id": "id"})),
    ("DeleteLoanRequestTool", "delete_loan_request", "Xóa một yêu cầu mượn sách theo id. Dùng khi nghiệp vụ cho phép xóa hẳn. Không dùng để chỉ hủy trạng thái. Dữ liệu thuộc người dùng hiện tại.", IdInput, MEMBER_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/library/loan-requests/{id}", path_params={"id": "id"})),
    ("ReserveLibraryBookTool", "reserve_library_book", "Đặt trước một đầu sách thư viện bằng book_id. Dùng khi chưa thể mượn ngay nhưng muốn giữ chỗ. Không dùng để xem chi tiết sách. Dữ liệu thuộc người dùng hiện tại.", ReservationInput, MEMBER_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/library/reservations", body_params={"book_id": "bookId"})),
    ("CancelLibraryReservationTool", "cancel_library_reservation", "Hủy một reservation sách theo id. Dùng cho người đặt hoặc admin. Không dùng để mượn sách trực tiếp.", IdInput, LIBRARY_REQUEST_VIEW_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/library/reservations/{id}", path_params={"id": "id"})),
    ("RenewLibraryLoanTool", "renew_library_loan", "Gia hạn một khoản mượn sách theo id. Dùng khi người dùng cần thêm thời gian mượn. Không dùng cho check-in sách. Dữ liệu thuộc người dùng hiện tại.", IdInput, MEMBER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/loans/{id}/renew", path_params={"id": "id"})),
    ("DeleteReturnedLoanTool", "delete_returned_loan", "Xóa một khoản mượn đã trả ở phía quản trị. Dùng để dọn dữ liệu nghiệp vụ khi phù hợp. Không dùng cho sinh viên. Dữ liệu quản trị.", IdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/library/admin/loans/{id}", path_params={"id": "id"})),
    ("CreateLibraryBookTool", "create_library_book", "Tạo đầu sách thư viện mới bằng payload nghiệp vụ. Dùng cho librarian hoặc admin. Không dùng cho upload ảnh bìa. Dữ liệu quản trị thư viện.", OrderInput, ADMIN_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/library/admin/books", body_field="payload")),
    ("UpdateLibraryBookTool", "update_library_book", "Cập nhật đầu sách thư viện bằng id và payload. Dùng cho librarian hoặc admin. Không dùng để tra cứu đơn giản. Dữ liệu quản trị thư viện.", EntityPayloadInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/admin/books/{id}", path_params={"id": "id"}, body_field="payload")),
    ("DeleteLibraryBookTool", "delete_library_book", "Xóa đầu sách thư viện theo id. Dùng cho quản trị thư viện. Không dùng nếu chỉ muốn đánh dấu ngừng lưu hành. Dữ liệu quản trị thư viện.", IdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/library/admin/books/{id}", path_params={"id": "id"})),
    ("ApproveLoanRequestTool", "approve_loan_request", "Phê duyệt yêu cầu mượn sách theo id. Dùng cho librarian hoặc admin. Không dùng khi chỉ xem danh sách yêu cầu. Dữ liệu quản trị thư viện.", IdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/admin/loan-requests/{id}/approve", path_params={"id": "id"})),
    ("RejectLoanRequestTool", "reject_loan_request", "Từ chối yêu cầu mượn sách theo id. Dùng cho librarian hoặc admin. Không dùng cho người dùng phổ thông. Dữ liệu quản trị thư viện.", IdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/admin/loan-requests/{id}/reject", path_params={"id": "id"})),
    ("CreateLibraryCopyTool", "create_library_copy", "Tạo bản copy cho một đầu sách bằng book id và payload nghiệp vụ. Dùng cho librarian hoặc admin. Không dùng cho người dùng phổ thông. Dữ liệu quản trị thư viện.", create_input_model("CreateLibraryCopyInput", {"book_id": (str, Field(min_length=1)), "payload": (dict[str, Any], Field(default_factory=dict, min_length=1))}), ADMIN_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/library/admin/books/{bookId}/copies", path_params={"book_id": "bookId"}, body_field="payload")),
    ("UpdateLibraryCopyTool", "update_library_copy", "Cập nhật thông tin một copy sách theo id. Dùng cho librarian hoặc admin. Không dùng để xem chi tiết sách. Dữ liệu quản trị thư viện.", EntityPayloadInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/admin/copies/{id}", path_params={"id": "id"}, body_field="payload")),
    ("DeleteLibraryCopyTool", "delete_library_copy", "Xóa một copy sách theo id. Dùng cho librarian hoặc admin. Không dùng cho người dùng phổ thông. Dữ liệu quản trị thư viện.", IdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/library/admin/copies/{id}", path_params={"id": "id"})),
    ("CheckoutLibraryCopyTool", "checkout_library_copy", "Thực hiện check-out một copy sách bằng payload nghiệp vụ. Dùng cho thủ thư khi giao sách. Không dùng cho sinh viên. Dữ liệu quản trị thư viện.", OrderInput, ADMIN_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/library/admin/check-out", body_field="payload")),
    ("CheckinLibraryLoanTool", "checkin_library_loan", "Thực hiện check-in trả sách cho một khoản mượn theo id. Dùng cho thủ thư khi nhận sách trả. Không dùng cho người dùng phổ thông. Dữ liệu quản trị thư viện.", IdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/admin/loans/{id}/check-in", path_params={"id": "id"})),
    ("MarkLibraryCopyLostTool", "mark_library_copy_lost", "Đánh dấu một copy sách là thất lạc. Dùng cho librarian hoặc admin. Không dùng cho thao tác mượn trả thông thường. Dữ liệu quản trị thư viện.", IdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/admin/copies/{id}/mark-lost", path_params={"id": "id"})),
    ("MarkLibraryCopyMaintenanceTool", "mark_library_copy_maintenance", "Đánh dấu một copy sách đang bảo trì. Dùng cho librarian hoặc admin. Không dùng cho tra cứu sách thông thường. Dữ liệu quản trị thư viện.", IdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/library/admin/copies/{id}/mark-maintenance", path_params={"id": "id"})),
    ("GetRoomScheduleTool", "get_room_schedule", "Lấy lịch sử dụng của một phòng học theo room_code và tuần bắt đầu. Dùng khi cần kiểm tra phòng trống hoặc lịch phòng. Không dùng để tạo đặt phòng.", RoomScheduleInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/room-bookings/rooms/{roomCode}/schedule", path_params={"room_code": "roomCode"}, query_params={"week_start": "weekStart"})),
    ("ListBuildingsTool", "list_buildings", "Liệt kê các tòa nhà có thể đặt phòng. Dùng trước khi chọn phòng. Không dùng cho thông tin cá nhân hóa. Dữ liệu công khai nội bộ.", NoServiceArguments, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/room-bookings/buildings")),
    ("ListBuildingRoomsTool", "list_building_rooms", "Liệt kê phòng của một tòa nhà, có thể lọc theo tầng và sức chứa tối thiểu. Không dùng nếu chưa có building_code.", BuildingRoomInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/room-bookings/buildings/{buildingCode}/rooms", path_params={"building_code": "buildingCode"}, query_params={"floor_number": "floorNumber", "min_capacity": "minCapacity"})),
    ("GetMyRoomBookingsTool", "get_my_room_bookings", "Lấy danh sách đặt phòng của người dùng hiện tại, có thể lọc theo trạng thái. Không dùng cho hàng đợi quản trị.", RoomBookingQueryInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/room-bookings/me", query_params={"status": "status"})),
    ("GetAdminRoomBookingsTool", "get_admin_room_bookings", "Lấy danh sách đặt phòng ở góc nhìn quản trị, có thể lọc theo trạng thái. Không dùng cho người dùng phổ thông.", RoomBookingQueryInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/room-bookings", query_params={"status": "status"})),
    ("GetAdminRequestRoomsTool", "get_admin_request_rooms", "Lấy danh sách phòng có yêu cầu chờ duyệt, có thể lọc theo trạng thái. Không dùng cho sinh viên.", RoomBookingQueryInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/room-bookings/admin/request-rooms", query_params={"status": "status"})),
    ("GetAdminRoomRequestSlotsTool", "get_admin_room_request_slots", "Lấy các khung giờ yêu cầu của một phòng theo room_code và trạng thái. Không dùng cho tạo booking.", RoomCodeStatusInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/room-bookings/admin/rooms/{roomCode}/request-slots", path_params={"room_code": "roomCode"}, query_params={"status": "status"})),
    ("GetAdminSlotRequestsTool", "get_admin_slot_requests", "Lấy các yêu cầu chi tiết của một khung giờ phòng theo room_code, date và time_slot_id. Dùng cho admin khi xử lý xung đột. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", RoomRequestSlotInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/room-bookings/admin/rooms/{roomCode}/request-slots/{date}/{timeSlotId}", path_params={"room_code": "roomCode", "date": "date", "time_slot_id": "timeSlotId"})),
    ("CreateRoomBookingTool", "create_room_booking", "Tạo yêu cầu đặt phòng mới bằng payload nghiệp vụ. Dùng khi người dùng đã chọn phòng và thời gian. Không dùng để xem lịch phòng. Dữ liệu thao tác của người dùng hiện tại.", OrderInput, USER_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/room-bookings", body_field="payload")),
    ("CancelRoomBookingTool", "cancel_room_booking", "Hủy một yêu cầu đặt phòng theo id. Dùng khi người dùng không còn nhu cầu sử dụng phòng. Không dùng cho phê duyệt quản trị. Dữ liệu thuộc người dùng hiện tại.", IdInput, USER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/room-bookings/{id}/cancel", path_params={"id": "id"})),
    ("DeleteRoomBookingTool", "delete_room_booking", "Xóa một booking phòng theo id. Dùng khi cần xóa hẳn dữ liệu booking hợp lệ. Không dùng nếu chỉ muốn hủy trạng thái. Dữ liệu thuộc người dùng hiện tại hoặc quản trị.", IdInput, USER_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/room-bookings/{id}", path_params={"id": "id"})),
    ("ApproveRoomBookingTool", "approve_room_booking", "Phê duyệt một yêu cầu đặt phòng theo id. Dùng cho admin. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", IdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/room-bookings/{id}/approve", path_params={"id": "id"})),
    ("RejectRoomBookingTool", "reject_room_booking", "Từ chối một yêu cầu đặt phòng theo id. Dùng cho admin khi booking không hợp lệ. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", IdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/room-bookings/{id}/reject", path_params={"id": "id"})),
    ("ApproveOneRoomRequestTool", "approve_one_room_request", "Phê duyệt một yêu cầu cụ thể trong nhóm khung giờ bằng payload nghiệp vụ. Dùng cho admin khi giải quyết xung đột đặt phòng. Không dùng cho sinh viên. Dữ liệu quản trị.", OrderInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/room-bookings/admin/request-slots/approve-one", body_field="payload")),
    ("RejectRoomSlotRequestsTool", "reject_room_slot_requests", "Từ chối nhóm yêu cầu của một khung giờ bằng payload nghiệp vụ. Dùng cho admin điều phối phòng. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", OrderInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/room-bookings/admin/request-slots/reject-all", body_field="payload")),
    ("CreateRoomScheduleOverrideTool", "create_room_schedule_override", "Tạo override lịch phòng bằng payload nghiệp vụ. Dùng cho admin khi cần chặn hoặc mở lịch đặc biệt. Không dùng cho booking thường. Dữ liệu quản trị.", OrderInput, ADMIN_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/room-bookings/admin/schedule-overrides", body_field="payload")),
    ("UpdateRoomScheduleOverrideTool", "update_room_schedule_override", "Cập nhật override lịch phòng theo id và payload. Dùng cho admin điều phối lịch phòng. Không dùng cho người dùng phổ thông. Dữ liệu quản trị.", EntityPayloadInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/room-bookings/admin/schedule-overrides/{id}", path_params={"id": "id"}, body_field="payload")),
    ("DeleteRoomScheduleOverrideTool", "delete_room_schedule_override", "Xóa override lịch phòng theo id. Dùng cho admin khi không còn cần ngoại lệ lịch phòng. Không dùng cho lịch booking cá nhân. Dữ liệu quản trị.", IdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/room-bookings/admin/schedule-overrides/{id}", path_params={"id": "id"})),
    ("CancelClassMeetingTool", "cancel_class_meeting", "Hủy một buổi học theo class meeting id. Dùng cho admin điều phối lịch học. Không dùng cho đặt phòng thông thường. Dữ liệu quản trị học vụ.", IdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="POST", path="/room-bookings/admin/class-meetings/{id}/cancel", path_params={"id": "id"})),
    ("MoveClassMeetingTool", "move_class_meeting", "Dời một buổi học sang khung khác bằng class meeting id và payload nghiệp vụ. Dùng cho admin điều phối lịch. Không dùng cho tra cứu lịch. Dữ liệu quản trị học vụ.", EntityPayloadInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="POST", path="/room-bookings/admin/class-meetings/{id}/move", path_params={"id": "id"}, body_field="payload")),
    ("ListNotificationsTool", "list_notifications", "Lấy danh sách thông báo của người dùng hiện tại theo trang. Không dùng cho gửi thông báo hệ thống.", PaginationInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/notifications", query_params={"page": "page", "limit": "limit"})),
    ("GetUnreadNotificationCountTool", "get_unread_notification_count", "Lấy số lượng thông báo chưa đọc của người dùng hiện tại. Dùng cho badge hoặc câu hỏi số lượng. Không dùng cho nội dung chi tiết thông báo. Dữ liệu thuộc người dùng hiện tại.", create_input_model("UnreadCountInput", {}), USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/notifications/unread-count")),
    ("GetNotificationTool", "get_notification", "Lấy chi tiết một thông báo theo id. Dùng khi người dùng cần xem nội dung cụ thể. Không dùng cho danh sách nhiều thông báo. Dữ liệu thuộc người dùng hiện tại.", IdInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/notifications/{id}", path_params={"id": "id"})),
    ("ListUpcomingEventsTool", "list_upcoming_events", "Lấy danh sách sự kiện sắp diễn ra theo trang. Dùng khi người dùng hỏi về sự kiện của trường.", EventPaginationInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/events", query_params={"page": "page", "limit": "limit"})),
    ("GetEventDetailTool", "get_event_detail", "Lấy chi tiết một sự kiện theo slug. Dùng khi đã biết sự kiện cần xem. Không dùng cho danh sách nhiều sự kiện. Dữ liệu công khai nội bộ.", SlugInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/events/{slug}", path_params={"slug": "slug"})),
    ("CreateSystemNotificationTool", "create_system_notification", "Tạo thông báo hệ thống bằng payload nghiệp vụ. Dùng cho giảng viên hoặc admin khi cần gửi thông báo. Không dùng cho push token.", OrderInput, NOTIFICATION_AUTHOR_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/notifications", body_field="payload")),
    ("MarkNotificationReadTool", "mark_notification_read", "Đánh dấu một thông báo là đã đọc. Dùng khi người dùng xác nhận đã xem thông báo. Không dùng để xóa thông báo. Dữ liệu thuộc người dùng hiện tại.", IdInput, USER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/notifications/{id}/read", path_params={"id": "id"})),
    ("MarkAllNotificationsReadTool", "mark_all_notifications_read", "Đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc. Dùng khi người dùng muốn dọn inbox. Không dùng để xóa dữ liệu. Dữ liệu thuộc người dùng hiện tại.", create_input_model("MarkAllReadInput", {}), USER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/notifications/read-all")),
    ("DeleteNotificationTool", "delete_notification", "Xóa một thông báo theo id khỏi hộp thư của người dùng hiện tại. Dùng khi người dùng muốn dọn một thông báo cụ thể. Không dùng cho broadcast creation. Dữ liệu thuộc người dùng hiện tại.", IdInput, USER_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/notifications/{id}", path_params={"id": "id"})),
    ("DeleteNotificationsTool", "delete_notifications", "Xóa các thông báo của người dùng hiện tại theo category hoặc trạng thái chưa đọc. Không dùng để xóa theo id; hãy dùng delete_notification cho một mục cụ thể.", DeleteNotificationsInput, USER_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/notifications", query_params={"category": "category", "unread_only": "unreadOnly"})),
    ("GetParkingStatusTool", "get_parking_status", "Lấy trạng thái bãi xe hiện tại, có thể lọc theo gate_id. Không dùng cho thanh toán.", ParkingStatusInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/parking/status", query_params={"gate_id": "gateId"})),
    ("GetMyVehiclesTool", "get_my_vehicles", "Lấy danh sách xe của người dùng hiện tại. Không dùng cho dữ liệu người khác.", NoServiceArguments, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/parking/vehicles")),
    ("GetLatestTelemetryTool", "get_latest_telemetry", "Lấy telemetry IoT mới nhất, có thể lọc theo gate_id. Không dùng để ingest telemetry.", TelemetryQueryInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/iot/telemetry/latest", query_params={"gate_id": "gateId"})),
    ("GetFireAlertsTool", "get_fire_alerts", "Lấy danh sách cảnh báo cháy theo trang. Không dùng cho ingest cảnh báo mới.", PaginationInput, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/safety/fire-alerts", query_params={"page": "page", "limit": "limit"})),
    ("GetActiveSosRequestsTool", "get_active_sos_requests", "Lấy danh sách SOS đang hoạt động. Dùng cho admin hoặc điều phối an toàn. Không dùng cho người dùng phổ thông xem toàn cục.", NoServiceArguments, ADMIN_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/sos/active")),
    ("GetMySosRequestsTool", "get_my_sos_requests", "Lấy các yêu cầu SOS của người dùng hiện tại. Không dùng để xem toàn bộ hệ thống.", NoServiceArguments, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/sos/me")),
    ("GetSosRouteTool", "get_sos_route", "Lấy lộ trình đến một yêu cầu SOS từ tọa độ from_lat/from_lng. Dùng khi đã có mã SOS cụ thể.", SosRouteInput, USER_ROLES, ToolOperation.READ, build_nest_request(method="GET", path="/sos/{sosId}/route", path_params={"sos_id": "sosId"}, query_params={"from_lat": "fromLat", "from_lng": "fromLng"})),
    ("RegisterVehicleTool", "register_vehicle", "Đăng ký xe mới bằng payload nghiệp vụ. Dùng khi người dùng thêm phương tiện của mình. Không dùng cho thanh toán. Dữ liệu thuộc người dùng hiện tại.", VehiclePayloadInput, USER_ROLES, ToolOperation.CREATE, build_nest_request(method="POST", path="/parking/vehicles", body_field="payload")),
    ("CreateParkingMomoPaymentTool", "create_parking_momo_payment", "Tạo thanh toán MoMo cho gói gửi xe theo vehicle_id. Dùng khi người dùng thanh toán đăng ký gửi xe. Không dùng cho webhook thanh toán. Dữ liệu thuộc người dùng hiện tại.", VehicleIdInput, USER_ROLES, ToolOperation.PAYMENT, build_nest_request(method="POST", path="/parking/subscriptions/{vehicleId}/payments/momo", path_params={"vehicle_id": "vehicleId"})),
    ("CreateParkingSepayPaymentTool", "create_parking_sepay_payment", "Tạo thanh toán SePay cho gói gửi xe theo vehicle_id. Dùng khi người dùng thanh toán qua SePay. Không dùng cho webhook. Dữ liệu thuộc người dùng hiện tại.", VehicleIdInput, USER_ROLES, ToolOperation.PAYMENT, build_nest_request(method="POST", path="/parking/subscriptions/{vehicleId}/payments/sepay", path_params={"vehicle_id": "vehicleId"})),
    ("MarkFireAlertReadTool", "mark_fire_alert_read", "Đánh dấu một cảnh báo cháy là đã đọc. Dùng cho bộ phận an toàn khi đã xử lý bước đầu. Không dùng để xóa cảnh báo. Dữ liệu vận hành nội bộ.", FireAlertIdInput, ADMIN_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/safety/fire-alerts/{alertId}/read", path_params={"alert_id": "alertId"})),
    ("DeleteFireAlertTool", "delete_fire_alert", "Xóa một cảnh báo cháy theo alert_id. Dùng cho quản trị an toàn khi nghiệp vụ cho phép dọn dữ liệu. Không dùng cho ingest cảnh báo. Dữ liệu vận hành nội bộ.", FireAlertIdInput, ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/safety/fire-alerts/{alertId}", path_params={"alert_id": "alertId"})),
    ("DeleteAllFireAlertsTool", "delete_all_fire_alerts", "Xóa toàn bộ cảnh báo cháy hiện có. Dùng rất hạn chế cho quản trị an toàn. Không dùng cho tra cứu thông tin. Dữ liệu vận hành nội bộ.", create_input_model("DeleteAllFireAlertsInput", {}), ADMIN_ROLES, ToolOperation.DELETE, build_nest_request(method="DELETE", path="/safety/fire-alerts")),
    ("CreateSosRequestTool", "create_sos_request", "Tạo yêu cầu SOS mới bằng payload nghiệp vụ. Dùng khi người dùng cần hỗ trợ khẩn cấp. Không dùng cho tra cứu lịch sử SOS. Dữ liệu thuộc người dùng hiện tại.", OrderInput, USER_ROLES, ToolOperation.EMERGENCY, build_nest_request(method="POST", path="/sos", body_field="payload")),
    ("CancelSosRequestTool", "cancel_sos_request", "Hủy một yêu cầu SOS theo sos_id. Dùng khi người dùng đã an toàn và muốn dừng yêu cầu. Không dùng cho xử lý yêu cầu của người khác. Dữ liệu thuộc người dùng hiện tại hoặc quản trị.", SosIdInput, USER_ROLES, ToolOperation.UPDATE, build_nest_request(method="PATCH", path="/sos/{sosId}/cancel", path_params={"sos_id": "sosId"})),
    ("ResolveSosRequestTool", "resolve_sos_request", "Đánh dấu một yêu cầu SOS là đã giải quyết theo sos_id. Dùng cho người yêu cầu hoặc admin khi sự cố đã xử lý xong. Không dùng để tạo yêu cầu mới. Dữ liệu thuộc người dùng hiện tại hoặc quản trị.", SosIdInput, frozenset({STUDENT, ADMIN, SUPER_ADMIN}), ToolOperation.EMERGENCY, build_nest_request(method="PATCH", path="/sos/{sosId}/resolve", path_params={"sos_id": "sosId"})),
]


def build_campus_service_tools(nest_client: NestApiClient) -> list:
    tools = []
    for class_name, name, description, input_model, roles, operation, request_builder in CAMPUS_SERVICE_SPECS:
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
