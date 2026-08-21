"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomBookingsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
var roles_guard_1 = require("../../common/guards/roles.guard");
var room_booking_response_dto_1 = require("./dto/room-booking-response.dto");
var room_list_response_dto_1 = require("./dto/room-list-response.dto");
var room_schedule_response_dto_1 = require("./dto/room-schedule-response.dto");
function parsePositiveInteger(value) {
    var parsedValue = Number.parseInt(String(value || '').trim(), 10);
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
}
var RoomBookingsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Room Bookings'), (0, common_1.Controller)('room-bookings')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createRoomBooking_decorators;
    var _getRoomSchedule_decorators;
    var _getBuildings_decorators;
    var _getBuildingRooms_decorators;
    var _getMyBookings_decorators;
    var _getAdminBookings_decorators;
    var _getAdminRequestRooms_decorators;
    var _getAdminRoomRequestSlots_decorators;
    var _getAdminSlotRequests_decorators;
    var _approveOneBooking_decorators;
    var _rejectSlotRequests_decorators;
    var _createScheduleOverride_decorators;
    var _updateScheduleOverride_decorators;
    var _deleteScheduleOverride_decorators;
    var _cancelClassMeetingOccurrence_decorators;
    var _moveClassMeetingOccurrence_decorators;
    var _approveBooking_decorators;
    var _rejectBooking_decorators;
    var _cancelBooking_decorators;
    var _deleteOwnBooking_decorators;
    var RoomBookingsController = _classThis = /** @class */ (function () {
        function RoomBookingsController_1(roomBookingsService) {
            this.roomBookingsService = (__runInitializers(this, _instanceExtraInitializers), roomBookingsService);
        }
        RoomBookingsController_1.prototype.createRoomBooking = function (userId, dto) {
            return this.roomBookingsService.createRoomBooking(userId, dto);
        };
        RoomBookingsController_1.prototype.getRoomSchedule = function (roomCode, weekStart) {
            return this.roomBookingsService.getRoomSchedule(roomCode, weekStart);
        };
        RoomBookingsController_1.prototype.getBuildings = function () {
            return this.roomBookingsService.getBuildings();
        };
        RoomBookingsController_1.prototype.getBuildingRooms = function (buildingCode, floorNumber, minCapacity) {
            return this.roomBookingsService.getBuildingRooms(buildingCode, {
                floorNumber: parsePositiveInteger(floorNumber),
                minCapacity: parsePositiveInteger(minCapacity),
            });
        };
        RoomBookingsController_1.prototype.getMyBookings = function (userId, status) {
            return this.roomBookingsService.getMyBookings(userId, status);
        };
        RoomBookingsController_1.prototype.getAdminBookings = function (status) {
            return this.roomBookingsService.getAdminBookings(status);
        };
        RoomBookingsController_1.prototype.getAdminRequestRooms = function (status) {
            return this.roomBookingsService.getAdminRequestRooms(status);
        };
        RoomBookingsController_1.prototype.getAdminRoomRequestSlots = function (roomCode, status) {
            return this.roomBookingsService.getAdminRoomRequestSlots(roomCode, status);
        };
        RoomBookingsController_1.prototype.getAdminSlotRequests = function (roomCode, date, timeSlotId) {
            return this.roomBookingsService.getAdminSlotRequests(roomCode, date, timeSlotId);
        };
        RoomBookingsController_1.prototype.approveOneBooking = function (dto, approverId) {
            return this.roomBookingsService.approveBooking(dto.bookingId, approverId);
        };
        RoomBookingsController_1.prototype.rejectSlotRequests = function (dto, approverId) {
            return this.roomBookingsService.rejectSlotRequests(dto, approverId);
        };
        RoomBookingsController_1.prototype.createScheduleOverride = function (dto, adminId) {
            return this.roomBookingsService.createScheduleOverride(dto, adminId);
        };
        RoomBookingsController_1.prototype.updateScheduleOverride = function (overrideId, dto) {
            return this.roomBookingsService.updateScheduleOverride(overrideId, dto);
        };
        RoomBookingsController_1.prototype.deleteScheduleOverride = function (overrideId) {
            return this.roomBookingsService.deleteScheduleOverride(overrideId);
        };
        RoomBookingsController_1.prototype.cancelClassMeetingOccurrence = function (classMeetingId, dto, adminId) {
            return this.roomBookingsService.cancelClassMeetingOccurrence(classMeetingId, dto, adminId);
        };
        RoomBookingsController_1.prototype.moveClassMeetingOccurrence = function (classMeetingId, dto, adminId) {
            return this.roomBookingsService.moveClassMeetingOccurrence(classMeetingId, dto, adminId);
        };
        RoomBookingsController_1.prototype.approveBooking = function (bookingId, approverId) {
            return this.roomBookingsService.approveBooking(bookingId, approverId);
        };
        RoomBookingsController_1.prototype.rejectBooking = function (bookingId, approverId) {
            return this.roomBookingsService.rejectBooking(bookingId, approverId);
        };
        RoomBookingsController_1.prototype.cancelBooking = function (bookingId, userId, role) {
            var isAdmin = role === shared_1.USER_ROLES.ADMIN || role === shared_1.USER_ROLES.SUPER_ADMIN;
            return this.roomBookingsService.cancelBooking(bookingId, userId, isAdmin);
        };
        RoomBookingsController_1.prototype.deleteOwnBooking = function (bookingId, userId) {
            return this.roomBookingsService.deleteOwnBooking(bookingId, userId);
        };
        return RoomBookingsController_1;
    }());
    __setFunctionName(_classThis, "RoomBookingsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createRoomBooking_decorators = [(0, common_1.Post)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create a room booking request with pending status' }), (0, swagger_1.ApiCreatedResponse)({
                description: 'Room booking request created successfully.',
                type: room_booking_response_dto_1.RoomBookingResponseDto,
            })];
        _getRoomSchedule_decorators = [(0, common_1.Get)('rooms/:roomCode/schedule'), (0, swagger_1.ApiOperation)({
                summary: 'Get the fixed weekly schedule grid for a room from Monday to Saturday (bookable weeks only: from next week onward)',
            }), (0, swagger_1.ApiParam)({
                name: 'roomCode',
                description: 'Room code.',
                example: 'B1.02',
            }), (0, swagger_1.ApiQuery)({
                name: 'weekStart',
                required: false,
                description: 'Monday (YYYY-MM-DD) of the week to load. Defaults to the first bookable week.',
                example: '2026-04-27',
            }), (0, swagger_1.ApiOkResponse)({
                description: 'Fixed room schedule with Monday to Saturday and all time slots.',
                type: room_schedule_response_dto_1.RoomScheduleResponseDto,
            })];
        _getBuildings_decorators = [(0, common_1.Get)('buildings'), (0, swagger_1.ApiOperation)({ summary: 'Get building availability summary' }), (0, swagger_1.ApiOkResponse)({
                description: 'Buildings with availability summary',
            })];
        _getBuildingRooms_decorators = [(0, common_1.Get)('buildings/:buildingCode/rooms'), (0, swagger_1.ApiOperation)({ summary: 'Get room availability in a building for the current time slot' }), (0, swagger_1.ApiParam)({
                name: 'buildingCode',
                description: 'Building code.',
                example: 'B',
            }), (0, swagger_1.ApiQuery)({
                name: 'floorNumber',
                required: false,
                type: Number,
                description: 'Optional floor number filter.',
                example: 3,
            }), (0, swagger_1.ApiQuery)({
                name: 'minCapacity',
                required: false,
                type: Number,
                description: 'Optional minimum capacity filter.',
                example: 80,
            }), (0, swagger_1.ApiOkResponse)({
                description: 'Rooms in the building with their current availability.',
                type: room_list_response_dto_1.RoomAvailabilityDto,
                isArray: true,
            })];
        _getMyBookings_decorators = [(0, common_1.Get)('me'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get room booking requests of current user' }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.RoomBookingStatus })];
        _getAdminBookings_decorators = [(0, common_1.Get)(), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get booking queue for admin' }), (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.RoomBookingStatus })];
        _getAdminRequestRooms_decorators = [(0, common_1.Get)('admin/request-rooms'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get pending request summary grouped by room for admin' })];
        _getAdminRoomRequestSlots_decorators = [(0, common_1.Get)('admin/rooms/:roomCode/request-slots'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'roomCode', description: 'Room code' }), (0, swagger_1.ApiOperation)({ summary: 'Get pending request slots in one room for admin' })];
        _getAdminSlotRequests_decorators = [(0, common_1.Get)('admin/rooms/:roomCode/request-slots/:date/:timeSlotId'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'roomCode', description: 'Room code' }), (0, swagger_1.ApiParam)({ name: 'date', description: 'Booking date YYYY-MM-DD' }), (0, swagger_1.ApiParam)({ name: 'timeSlotId', description: 'Time slot id' }), (0, swagger_1.ApiOperation)({ summary: 'Get booking requests for one room/date/slot' })];
        _approveOneBooking_decorators = [(0, common_1.Patch)('admin/request-slots/approve-one'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Approve one request and reject overlapping pending requests' })];
        _rejectSlotRequests_decorators = [(0, common_1.Patch)('admin/request-slots/reject-all'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Reject all pending requests in a room/date/slot group' })];
        _createScheduleOverride_decorators = [(0, common_1.Post)('admin/schedule-overrides'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Create manual or maintenance schedule override' })];
        _updateScheduleOverride_decorators = [(0, common_1.Patch)('admin/schedule-overrides/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Schedule override id' }), (0, swagger_1.ApiOperation)({ summary: 'Update schedule override' })];
        _deleteScheduleOverride_decorators = [(0, common_1.Delete)('admin/schedule-overrides/:id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Schedule override id' }), (0, swagger_1.ApiOperation)({ summary: 'Delete schedule override' })];
        _cancelClassMeetingOccurrence_decorators = [(0, common_1.Post)('admin/class-meetings/:classMeetingId/cancel'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Cancel one class meeting occurrence' })];
        _moveClassMeetingOccurrence_decorators = [(0, common_1.Post)('admin/class-meetings/:classMeetingId/move'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Move one class meeting occurrence' })];
        _approveBooking_decorators = [(0, common_1.Patch)(':id/approve'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Room booking id' }), (0, swagger_1.ApiOperation)({ summary: 'Approve room booking request' })];
        _rejectBooking_decorators = [(0, common_1.Patch)(':id/reject'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, roles_decorator_1.Roles)(shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Room booking id' }), (0, swagger_1.ApiOperation)({ summary: 'Reject room booking request' })];
        _cancelBooking_decorators = [(0, common_1.Patch)(':id/cancel'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Room booking id' }), (0, swagger_1.ApiOperation)({ summary: 'Cancel room booking request' })];
        _deleteOwnBooking_decorators = [(0, common_1.Delete)(':id'), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiParam)({ name: 'id', description: 'Room booking id' }), (0, swagger_1.ApiOperation)({ summary: 'Delete own room booking request' })];
        __esDecorate(_classThis, null, _createRoomBooking_decorators, { kind: "method", name: "createRoomBooking", static: false, private: false, access: { has: function (obj) { return "createRoomBooking" in obj; }, get: function (obj) { return obj.createRoomBooking; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getRoomSchedule_decorators, { kind: "method", name: "getRoomSchedule", static: false, private: false, access: { has: function (obj) { return "getRoomSchedule" in obj; }, get: function (obj) { return obj.getRoomSchedule; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBuildings_decorators, { kind: "method", name: "getBuildings", static: false, private: false, access: { has: function (obj) { return "getBuildings" in obj; }, get: function (obj) { return obj.getBuildings; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBuildingRooms_decorators, { kind: "method", name: "getBuildingRooms", static: false, private: false, access: { has: function (obj) { return "getBuildingRooms" in obj; }, get: function (obj) { return obj.getBuildingRooms; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getMyBookings_decorators, { kind: "method", name: "getMyBookings", static: false, private: false, access: { has: function (obj) { return "getMyBookings" in obj; }, get: function (obj) { return obj.getMyBookings; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminBookings_decorators, { kind: "method", name: "getAdminBookings", static: false, private: false, access: { has: function (obj) { return "getAdminBookings" in obj; }, get: function (obj) { return obj.getAdminBookings; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminRequestRooms_decorators, { kind: "method", name: "getAdminRequestRooms", static: false, private: false, access: { has: function (obj) { return "getAdminRequestRooms" in obj; }, get: function (obj) { return obj.getAdminRequestRooms; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminRoomRequestSlots_decorators, { kind: "method", name: "getAdminRoomRequestSlots", static: false, private: false, access: { has: function (obj) { return "getAdminRoomRequestSlots" in obj; }, get: function (obj) { return obj.getAdminRoomRequestSlots; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAdminSlotRequests_decorators, { kind: "method", name: "getAdminSlotRequests", static: false, private: false, access: { has: function (obj) { return "getAdminSlotRequests" in obj; }, get: function (obj) { return obj.getAdminSlotRequests; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approveOneBooking_decorators, { kind: "method", name: "approveOneBooking", static: false, private: false, access: { has: function (obj) { return "approveOneBooking" in obj; }, get: function (obj) { return obj.approveOneBooking; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _rejectSlotRequests_decorators, { kind: "method", name: "rejectSlotRequests", static: false, private: false, access: { has: function (obj) { return "rejectSlotRequests" in obj; }, get: function (obj) { return obj.rejectSlotRequests; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createScheduleOverride_decorators, { kind: "method", name: "createScheduleOverride", static: false, private: false, access: { has: function (obj) { return "createScheduleOverride" in obj; }, get: function (obj) { return obj.createScheduleOverride; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateScheduleOverride_decorators, { kind: "method", name: "updateScheduleOverride", static: false, private: false, access: { has: function (obj) { return "updateScheduleOverride" in obj; }, get: function (obj) { return obj.updateScheduleOverride; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteScheduleOverride_decorators, { kind: "method", name: "deleteScheduleOverride", static: false, private: false, access: { has: function (obj) { return "deleteScheduleOverride" in obj; }, get: function (obj) { return obj.deleteScheduleOverride; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancelClassMeetingOccurrence_decorators, { kind: "method", name: "cancelClassMeetingOccurrence", static: false, private: false, access: { has: function (obj) { return "cancelClassMeetingOccurrence" in obj; }, get: function (obj) { return obj.cancelClassMeetingOccurrence; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _moveClassMeetingOccurrence_decorators, { kind: "method", name: "moveClassMeetingOccurrence", static: false, private: false, access: { has: function (obj) { return "moveClassMeetingOccurrence" in obj; }, get: function (obj) { return obj.moveClassMeetingOccurrence; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approveBooking_decorators, { kind: "method", name: "approveBooking", static: false, private: false, access: { has: function (obj) { return "approveBooking" in obj; }, get: function (obj) { return obj.approveBooking; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _rejectBooking_decorators, { kind: "method", name: "rejectBooking", static: false, private: false, access: { has: function (obj) { return "rejectBooking" in obj; }, get: function (obj) { return obj.rejectBooking; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancelBooking_decorators, { kind: "method", name: "cancelBooking", static: false, private: false, access: { has: function (obj) { return "cancelBooking" in obj; }, get: function (obj) { return obj.cancelBooking; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteOwnBooking_decorators, { kind: "method", name: "deleteOwnBooking", static: false, private: false, access: { has: function (obj) { return "deleteOwnBooking" in obj; }, get: function (obj) { return obj.deleteOwnBooking; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RoomBookingsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RoomBookingsController = _classThis;
}();
exports.RoomBookingsController = RoomBookingsController;
