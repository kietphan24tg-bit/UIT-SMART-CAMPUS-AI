"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var env_validation_1 = require("./config/env.validation");
var database_module_1 = require("./database/database.module");
var attendance_module_1 = require("./modules/attendance/attendance.module");
var canteen_module_1 = require("./modules/canteen/canteen.module");
var events_module_1 = require("./modules/events/events.module");
var auth_module_1 = require("./modules/auth/auth.module");
var catalog_module_1 = require("./modules/catalog/catalog.module");
var chatbot_module_1 = require("./modules/chatbot/chatbot.module");
var grades_module_1 = require("./modules/grades/grades.module");
var health_module_1 = require("./modules/health/health.module");
var iot_module_1 = require("./modules/iot/iot.module");
var library_module_1 = require("./modules/library/library.module");
var notifications_module_1 = require("./modules/notifications/notifications.module");
var parking_module_1 = require("./modules/parking/parking.module");
var payments_module_1 = require("./modules/payments/payments.module");
var registrations_module_1 = require("./modules/registrations/registrations.module");
var room_bookings_module_1 = require("./modules/room-bookings/room-bookings.module");
var schedule_module_1 = require("./modules/schedule/schedule.module");
var sos_module_1 = require("./modules/sos/sos.module");
var study_materials_module_1 = require("./modules/study-materials/study-materials.module");
var users_module_1 = require("./modules/users/users.module");
var AppModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    validate: env_validation_1.validate,
                    envFilePath: ['.env.local', '.env'],
                }),
                database_module_1.DatabaseModule,
                auth_module_1.AuthModule,
                attendance_module_1.AttendanceModule,
                catalog_module_1.CatalogModule,
                users_module_1.UsersModule,
                schedule_module_1.ScheduleModule,
                grades_module_1.GradesModule,
                health_module_1.HealthModule,
                events_module_1.EventsModule,
                notifications_module_1.NotificationsModule,
                library_module_1.LibraryModule,
                canteen_module_1.CanteenModule,
                sos_module_1.SosModule,
                chatbot_module_1.ChatbotModule,
                parking_module_1.ParkingModule,
                room_bookings_module_1.RoomBookingsModule,
                registrations_module_1.RegistrationsModule,
                iot_module_1.IotModule,
                payments_module_1.PaymentsModule,
                study_materials_module_1.StudyMaterialsModule,
            ],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AppModule = _classThis = /** @class */ (function () {
        function AppModule_1() {
        }
        return AppModule_1;
    }());
    __setFunctionName(_classThis, "AppModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
}();
exports.AppModule = AppModule;
