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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
var class_transformer_1 = require("class-transformer");
var class_validator_1 = require("class-validator");
function toOptionalNumber(defaultValue) {
    return (0, class_transformer_1.Transform)(function (_a) {
        var value = _a.value;
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        var normalized = typeof value === 'string' ? value.trim() : value;
        if (normalized === '') {
            return defaultValue;
        }
        var parsed = Number(normalized);
        return Number.isNaN(parsed) ? value : parsed;
    });
}
function toOptionalBoolean(defaultValue) {
    return (0, class_transformer_1.Transform)(function (_a) {
        var value = _a.value;
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            var normalized = value.trim().toLowerCase();
            if (normalized === '') {
                return defaultValue;
            }
            if (normalized === 'true') {
                return true;
            }
            if (normalized === 'false') {
                return false;
            }
        }
        return value;
    });
}
var EnvironmentVariables = function () {
    var _a;
    var _NODE_ENV_decorators;
    var _NODE_ENV_initializers = [];
    var _NODE_ENV_extraInitializers = [];
    var _PORT_decorators;
    var _PORT_initializers = [];
    var _PORT_extraInitializers = [];
    var _DATABASE_URL_decorators;
    var _DATABASE_URL_initializers = [];
    var _DATABASE_URL_extraInitializers = [];
    var _JWT_SECRET_decorators;
    var _JWT_SECRET_initializers = [];
    var _JWT_SECRET_extraInitializers = [];
    var _JWT_EXPIRATION_decorators;
    var _JWT_EXPIRATION_initializers = [];
    var _JWT_EXPIRATION_extraInitializers = [];
    var _JWT_REFRESH_EXPIRATION_decorators;
    var _JWT_REFRESH_EXPIRATION_initializers = [];
    var _JWT_REFRESH_EXPIRATION_extraInitializers = [];
    var _CORS_ORIGIN_decorators;
    var _CORS_ORIGIN_initializers = [];
    var _CORS_ORIGIN_extraInitializers = [];
    var _APP_BASE_URL_decorators;
    var _APP_BASE_URL_initializers = [];
    var _APP_BASE_URL_extraInitializers = [];
    var _ATTENDANCE_TOKEN_TTL_SECONDS_decorators;
    var _ATTENDANCE_TOKEN_TTL_SECONDS_initializers = [];
    var _ATTENDANCE_TOKEN_TTL_SECONDS_extraInitializers = [];
    var _REDIS_URL_decorators;
    var _REDIS_URL_initializers = [];
    var _REDIS_URL_extraInitializers = [];
    var _IOT_SHARED_SECRET_decorators;
    var _IOT_SHARED_SECRET_initializers = [];
    var _IOT_SHARED_SECRET_extraInitializers = [];
    var _IOT_MQTT_ENABLED_decorators;
    var _IOT_MQTT_ENABLED_initializers = [];
    var _IOT_MQTT_ENABLED_extraInitializers = [];
    var _IOT_MQTT_BROKER_URL_decorators;
    var _IOT_MQTT_BROKER_URL_initializers = [];
    var _IOT_MQTT_BROKER_URL_extraInitializers = [];
    var _IOT_MQTT_USERNAME_decorators;
    var _IOT_MQTT_USERNAME_initializers = [];
    var _IOT_MQTT_USERNAME_extraInitializers = [];
    var _IOT_MQTT_PASSWORD_decorators;
    var _IOT_MQTT_PASSWORD_initializers = [];
    var _IOT_MQTT_PASSWORD_extraInitializers = [];
    var _IOT_MQTT_CLIENT_ID_decorators;
    var _IOT_MQTT_CLIENT_ID_initializers = [];
    var _IOT_MQTT_CLIENT_ID_extraInitializers = [];
    var _IOT_MQTT_TELEMETRY_TOPIC_decorators;
    var _IOT_MQTT_TELEMETRY_TOPIC_initializers = [];
    var _IOT_MQTT_TELEMETRY_TOPIC_extraInitializers = [];
    var _SMTP_HOST_decorators;
    var _SMTP_HOST_initializers = [];
    var _SMTP_HOST_extraInitializers = [];
    var _SMTP_PORT_decorators;
    var _SMTP_PORT_initializers = [];
    var _SMTP_PORT_extraInitializers = [];
    var _SMTP_SECURE_decorators;
    var _SMTP_SECURE_initializers = [];
    var _SMTP_SECURE_extraInitializers = [];
    var _SMTP_USER_decorators;
    var _SMTP_USER_initializers = [];
    var _SMTP_USER_extraInitializers = [];
    var _SMTP_PASS_decorators;
    var _SMTP_PASS_initializers = [];
    var _SMTP_PASS_extraInitializers = [];
    var _SMTP_FROM_decorators;
    var _SMTP_FROM_initializers = [];
    var _SMTP_FROM_extraInitializers = [];
    var _MOMO_PARTNER_CODE_decorators;
    var _MOMO_PARTNER_CODE_initializers = [];
    var _MOMO_PARTNER_CODE_extraInitializers = [];
    var _MOMO_ACCESS_KEY_decorators;
    var _MOMO_ACCESS_KEY_initializers = [];
    var _MOMO_ACCESS_KEY_extraInitializers = [];
    var _MOMO_SECRET_KEY_decorators;
    var _MOMO_SECRET_KEY_initializers = [];
    var _MOMO_SECRET_KEY_extraInitializers = [];
    var _MOMO_REDIRECT_URL_decorators;
    var _MOMO_REDIRECT_URL_initializers = [];
    var _MOMO_REDIRECT_URL_extraInitializers = [];
    var _MOMO_IPN_URL_decorators;
    var _MOMO_IPN_URL_initializers = [];
    var _MOMO_IPN_URL_extraInitializers = [];
    var _SEPAY_API_TOKEN_decorators;
    var _SEPAY_API_TOKEN_initializers = [];
    var _SEPAY_API_TOKEN_extraInitializers = [];
    var _SEPAY_BANK_ACCOUNT_UUID_decorators;
    var _SEPAY_BANK_ACCOUNT_UUID_initializers = [];
    var _SEPAY_BANK_ACCOUNT_UUID_extraInitializers = [];
    var _SEPAY_API_BASE_URL_decorators;
    var _SEPAY_API_BASE_URL_initializers = [];
    var _SEPAY_API_BASE_URL_extraInitializers = [];
    var _SEPAY_VA_PREFIX_decorators;
    var _SEPAY_VA_PREFIX_initializers = [];
    var _SEPAY_VA_PREFIX_extraInitializers = [];
    var _SEPAY_WEBHOOK_API_KEY_decorators;
    var _SEPAY_WEBHOOK_API_KEY_initializers = [];
    var _SEPAY_WEBHOOK_API_KEY_extraInitializers = [];
    var _SEPAY_BANK_NAME_decorators;
    var _SEPAY_BANK_NAME_initializers = [];
    var _SEPAY_BANK_NAME_extraInitializers = [];
    var _SEPAY_ACCOUNT_NUMBER_decorators;
    var _SEPAY_ACCOUNT_NUMBER_initializers = [];
    var _SEPAY_ACCOUNT_NUMBER_extraInitializers = [];
    var _SEPAY_ACCOUNT_NAME_decorators;
    var _SEPAY_ACCOUNT_NAME_initializers = [];
    var _SEPAY_ACCOUNT_NAME_extraInitializers = [];
    var _SEPAY_QR_BASE_URL_decorators;
    var _SEPAY_QR_BASE_URL_initializers = [];
    var _SEPAY_QR_BASE_URL_extraInitializers = [];
    var _AVATAR_STORAGE_BUCKET_decorators;
    var _AVATAR_STORAGE_BUCKET_initializers = [];
    var _AVATAR_STORAGE_BUCKET_extraInitializers = [];
    var _AVATAR_STORAGE_ENDPOINT_decorators;
    var _AVATAR_STORAGE_ENDPOINT_initializers = [];
    var _AVATAR_STORAGE_ENDPOINT_extraInitializers = [];
    var _AVATAR_STORAGE_ACCESS_KEY_ID_decorators;
    var _AVATAR_STORAGE_ACCESS_KEY_ID_initializers = [];
    var _AVATAR_STORAGE_ACCESS_KEY_ID_extraInitializers = [];
    var _AVATAR_STORAGE_SECRET_ACCESS_KEY_decorators;
    var _AVATAR_STORAGE_SECRET_ACCESS_KEY_initializers = [];
    var _AVATAR_STORAGE_SECRET_ACCESS_KEY_extraInitializers = [];
    var _AVATAR_STORAGE_REGION_decorators;
    var _AVATAR_STORAGE_REGION_initializers = [];
    var _AVATAR_STORAGE_REGION_extraInitializers = [];
    var _AVATAR_STORAGE_PUBLIC_BASE_URL_decorators;
    var _AVATAR_STORAGE_PUBLIC_BASE_URL_initializers = [];
    var _AVATAR_STORAGE_PUBLIC_BASE_URL_extraInitializers = [];
    var _UIT_EVENTS_MAX_PAGES_decorators;
    var _UIT_EVENTS_MAX_PAGES_initializers = [];
    var _UIT_EVENTS_MAX_PAGES_extraInitializers = [];
    var _UIT_EVENTS_INITIAL_PAGES_decorators;
    var _UIT_EVENTS_INITIAL_PAGES_initializers = [];
    var _UIT_EVENTS_INITIAL_PAGES_extraInitializers = [];
    var _UIT_EVENTS_CACHE_TTL_MS_decorators;
    var _UIT_EVENTS_CACHE_TTL_MS_initializers = [];
    var _UIT_EVENTS_CACHE_TTL_MS_extraInitializers = [];
    var _UIT_EVENTS_REQUEST_TIMEOUT_MS_decorators;
    var _UIT_EVENTS_REQUEST_TIMEOUT_MS_initializers = [];
    var _UIT_EVENTS_REQUEST_TIMEOUT_MS_extraInitializers = [];
    var _TRACK_ASIA_SERVER_KEY_decorators;
    var _TRACK_ASIA_SERVER_KEY_initializers = [];
    var _TRACK_ASIA_SERVER_KEY_extraInitializers = [];
    var _TRACK_ASIA_STYLE_URL_decorators;
    var _TRACK_ASIA_STYLE_URL_initializers = [];
    var _TRACK_ASIA_STYLE_URL_extraInitializers = [];
    var _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_decorators;
    var _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_initializers = [];
    var _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_extraInitializers = [];
    var _OPEN_LIBRARY_USER_AGENT_decorators;
    var _OPEN_LIBRARY_USER_AGENT_initializers = [];
    var _OPEN_LIBRARY_USER_AGENT_extraInitializers = [];
    return _a = /** @class */ (function () {
            function EnvironmentVariables() {
                this.NODE_ENV = __runInitializers(this, _NODE_ENV_initializers, void 0);
                this.PORT = (__runInitializers(this, _NODE_ENV_extraInitializers), __runInitializers(this, _PORT_initializers, 3000));
                this.DATABASE_URL = (__runInitializers(this, _PORT_extraInitializers), __runInitializers(this, _DATABASE_URL_initializers, void 0));
                this.JWT_SECRET = (__runInitializers(this, _DATABASE_URL_extraInitializers), __runInitializers(this, _JWT_SECRET_initializers, void 0));
                this.JWT_EXPIRATION = (__runInitializers(this, _JWT_SECRET_extraInitializers), __runInitializers(this, _JWT_EXPIRATION_initializers, '15m'));
                this.JWT_REFRESH_EXPIRATION = (__runInitializers(this, _JWT_EXPIRATION_extraInitializers), __runInitializers(this, _JWT_REFRESH_EXPIRATION_initializers, '7d'));
                this.CORS_ORIGIN = (__runInitializers(this, _JWT_REFRESH_EXPIRATION_extraInitializers), __runInitializers(this, _CORS_ORIGIN_initializers, '*'));
                this.APP_BASE_URL = (__runInitializers(this, _CORS_ORIGIN_extraInitializers), __runInitializers(this, _APP_BASE_URL_initializers, 'http://localhost:3000'));
                this.ATTENDANCE_TOKEN_TTL_SECONDS = (__runInitializers(this, _APP_BASE_URL_extraInitializers), __runInitializers(this, _ATTENDANCE_TOKEN_TTL_SECONDS_initializers, 90));
                this.REDIS_URL = (__runInitializers(this, _ATTENDANCE_TOKEN_TTL_SECONDS_extraInitializers), __runInitializers(this, _REDIS_URL_initializers, 'redis://localhost:6379'));
                this.IOT_SHARED_SECRET = (__runInitializers(this, _REDIS_URL_extraInitializers), __runInitializers(this, _IOT_SHARED_SECRET_initializers, 'change-me'));
                this.IOT_MQTT_ENABLED = (__runInitializers(this, _IOT_SHARED_SECRET_extraInitializers), __runInitializers(this, _IOT_MQTT_ENABLED_initializers, false));
                this.IOT_MQTT_BROKER_URL = (__runInitializers(this, _IOT_MQTT_ENABLED_extraInitializers), __runInitializers(this, _IOT_MQTT_BROKER_URL_initializers, ''));
                this.IOT_MQTT_USERNAME = (__runInitializers(this, _IOT_MQTT_BROKER_URL_extraInitializers), __runInitializers(this, _IOT_MQTT_USERNAME_initializers, ''));
                this.IOT_MQTT_PASSWORD = (__runInitializers(this, _IOT_MQTT_USERNAME_extraInitializers), __runInitializers(this, _IOT_MQTT_PASSWORD_initializers, ''));
                this.IOT_MQTT_CLIENT_ID = (__runInitializers(this, _IOT_MQTT_PASSWORD_extraInitializers), __runInitializers(this, _IOT_MQTT_CLIENT_ID_initializers, 'smart-campus-api'));
                this.IOT_MQTT_TELEMETRY_TOPIC = (__runInitializers(this, _IOT_MQTT_CLIENT_ID_extraInitializers), __runInitializers(this, _IOT_MQTT_TELEMETRY_TOPIC_initializers, 'uit/parking/telemetry'));
                this.SMTP_HOST = (__runInitializers(this, _IOT_MQTT_TELEMETRY_TOPIC_extraInitializers), __runInitializers(this, _SMTP_HOST_initializers, ''));
                this.SMTP_PORT = (__runInitializers(this, _SMTP_HOST_extraInitializers), __runInitializers(this, _SMTP_PORT_initializers, 587));
                this.SMTP_SECURE = (__runInitializers(this, _SMTP_PORT_extraInitializers), __runInitializers(this, _SMTP_SECURE_initializers, false));
                this.SMTP_USER = (__runInitializers(this, _SMTP_SECURE_extraInitializers), __runInitializers(this, _SMTP_USER_initializers, ''));
                this.SMTP_PASS = (__runInitializers(this, _SMTP_USER_extraInitializers), __runInitializers(this, _SMTP_PASS_initializers, ''));
                this.SMTP_FROM = (__runInitializers(this, _SMTP_PASS_extraInitializers), __runInitializers(this, _SMTP_FROM_initializers, ''));
                this.MOMO_PARTNER_CODE = (__runInitializers(this, _SMTP_FROM_extraInitializers), __runInitializers(this, _MOMO_PARTNER_CODE_initializers, ''));
                this.MOMO_ACCESS_KEY = (__runInitializers(this, _MOMO_PARTNER_CODE_extraInitializers), __runInitializers(this, _MOMO_ACCESS_KEY_initializers, ''));
                this.MOMO_SECRET_KEY = (__runInitializers(this, _MOMO_ACCESS_KEY_extraInitializers), __runInitializers(this, _MOMO_SECRET_KEY_initializers, ''));
                this.MOMO_REDIRECT_URL = (__runInitializers(this, _MOMO_SECRET_KEY_extraInitializers), __runInitializers(this, _MOMO_REDIRECT_URL_initializers, 'http://localhost:3000/api/v1/payments/momo/return'));
                this.MOMO_IPN_URL = (__runInitializers(this, _MOMO_REDIRECT_URL_extraInitializers), __runInitializers(this, _MOMO_IPN_URL_initializers, 'http://localhost:3000/api/v1/payments/momo/webhook'));
                this.SEPAY_API_TOKEN = (__runInitializers(this, _MOMO_IPN_URL_extraInitializers), __runInitializers(this, _SEPAY_API_TOKEN_initializers, ''));
                this.SEPAY_BANK_ACCOUNT_UUID = (__runInitializers(this, _SEPAY_API_TOKEN_extraInitializers), __runInitializers(this, _SEPAY_BANK_ACCOUNT_UUID_initializers, ''));
                this.SEPAY_API_BASE_URL = (__runInitializers(this, _SEPAY_BANK_ACCOUNT_UUID_extraInitializers), __runInitializers(this, _SEPAY_API_BASE_URL_initializers, 'https://userapi.sepay.vn/v2'));
                this.SEPAY_VA_PREFIX = (__runInitializers(this, _SEPAY_API_BASE_URL_extraInitializers), __runInitializers(this, _SEPAY_VA_PREFIX_initializers, ''));
                this.SEPAY_WEBHOOK_API_KEY = (__runInitializers(this, _SEPAY_VA_PREFIX_extraInitializers), __runInitializers(this, _SEPAY_WEBHOOK_API_KEY_initializers, ''));
                this.SEPAY_BANK_NAME = (__runInitializers(this, _SEPAY_WEBHOOK_API_KEY_extraInitializers), __runInitializers(this, _SEPAY_BANK_NAME_initializers, ''));
                this.SEPAY_ACCOUNT_NUMBER = (__runInitializers(this, _SEPAY_BANK_NAME_extraInitializers), __runInitializers(this, _SEPAY_ACCOUNT_NUMBER_initializers, ''));
                this.SEPAY_ACCOUNT_NAME = (__runInitializers(this, _SEPAY_ACCOUNT_NUMBER_extraInitializers), __runInitializers(this, _SEPAY_ACCOUNT_NAME_initializers, ''));
                this.SEPAY_QR_BASE_URL = (__runInitializers(this, _SEPAY_ACCOUNT_NAME_extraInitializers), __runInitializers(this, _SEPAY_QR_BASE_URL_initializers, 'https://qr.sepay.vn/img'));
                this.AVATAR_STORAGE_BUCKET = (__runInitializers(this, _SEPAY_QR_BASE_URL_extraInitializers), __runInitializers(this, _AVATAR_STORAGE_BUCKET_initializers, ''));
                this.AVATAR_STORAGE_ENDPOINT = (__runInitializers(this, _AVATAR_STORAGE_BUCKET_extraInitializers), __runInitializers(this, _AVATAR_STORAGE_ENDPOINT_initializers, ''));
                this.AVATAR_STORAGE_ACCESS_KEY_ID = (__runInitializers(this, _AVATAR_STORAGE_ENDPOINT_extraInitializers), __runInitializers(this, _AVATAR_STORAGE_ACCESS_KEY_ID_initializers, ''));
                this.AVATAR_STORAGE_SECRET_ACCESS_KEY = (__runInitializers(this, _AVATAR_STORAGE_ACCESS_KEY_ID_extraInitializers), __runInitializers(this, _AVATAR_STORAGE_SECRET_ACCESS_KEY_initializers, ''));
                this.AVATAR_STORAGE_REGION = (__runInitializers(this, _AVATAR_STORAGE_SECRET_ACCESS_KEY_extraInitializers), __runInitializers(this, _AVATAR_STORAGE_REGION_initializers, 'us-east-1'));
                this.AVATAR_STORAGE_PUBLIC_BASE_URL = (__runInitializers(this, _AVATAR_STORAGE_REGION_extraInitializers), __runInitializers(this, _AVATAR_STORAGE_PUBLIC_BASE_URL_initializers, ''));
                this.UIT_EVENTS_MAX_PAGES = (__runInitializers(this, _AVATAR_STORAGE_PUBLIC_BASE_URL_extraInitializers), __runInitializers(this, _UIT_EVENTS_MAX_PAGES_initializers, 10));
                this.UIT_EVENTS_INITIAL_PAGES = (__runInitializers(this, _UIT_EVENTS_MAX_PAGES_extraInitializers), __runInitializers(this, _UIT_EVENTS_INITIAL_PAGES_initializers, 2));
                this.UIT_EVENTS_CACHE_TTL_MS = (__runInitializers(this, _UIT_EVENTS_INITIAL_PAGES_extraInitializers), __runInitializers(this, _UIT_EVENTS_CACHE_TTL_MS_initializers, 3600000));
                this.UIT_EVENTS_REQUEST_TIMEOUT_MS = (__runInitializers(this, _UIT_EVENTS_CACHE_TTL_MS_extraInitializers), __runInitializers(this, _UIT_EVENTS_REQUEST_TIMEOUT_MS_initializers, 20000));
                this.TRACK_ASIA_SERVER_KEY = (__runInitializers(this, _UIT_EVENTS_REQUEST_TIMEOUT_MS_extraInitializers), __runInitializers(this, _TRACK_ASIA_SERVER_KEY_initializers, ''));
                this.TRACK_ASIA_STYLE_URL = (__runInitializers(this, _TRACK_ASIA_SERVER_KEY_extraInitializers), __runInitializers(this, _TRACK_ASIA_STYLE_URL_initializers, ''));
                this.EXPO_PUBLIC_TRACK_ASIA_MAP_KEY = (__runInitializers(this, _TRACK_ASIA_STYLE_URL_extraInitializers), __runInitializers(this, _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_initializers, ''));
                this.OPEN_LIBRARY_USER_AGENT = (__runInitializers(this, _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_extraInitializers), __runInitializers(this, _OPEN_LIBRARY_USER_AGENT_initializers, 'smart-campus-demo/1.0'));
                __runInitializers(this, _OPEN_LIBRARY_USER_AGENT_extraInitializers);
            }
            return EnvironmentVariables;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _NODE_ENV_decorators = [(0, class_validator_1.IsIn)(['development', 'test', 'staging', 'production']), (0, class_validator_1.IsOptional)()];
            _PORT_decorators = [toOptionalNumber(3000), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _DATABASE_URL_decorators = [(0, class_validator_1.IsString)()];
            _JWT_SECRET_decorators = [(0, class_validator_1.IsString)()];
            _JWT_EXPIRATION_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _JWT_REFRESH_EXPIRATION_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _CORS_ORIGIN_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _APP_BASE_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _ATTENDANCE_TOKEN_TTL_SECONDS_decorators = [toOptionalNumber(90), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _REDIS_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _IOT_SHARED_SECRET_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _IOT_MQTT_ENABLED_decorators = [toOptionalBoolean(false), (0, class_validator_1.IsBoolean)(), (0, class_validator_1.IsOptional)()];
            _IOT_MQTT_BROKER_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _IOT_MQTT_USERNAME_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _IOT_MQTT_PASSWORD_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _IOT_MQTT_CLIENT_ID_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _IOT_MQTT_TELEMETRY_TOPIC_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SMTP_HOST_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SMTP_PORT_decorators = [toOptionalNumber(587), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _SMTP_SECURE_decorators = [toOptionalBoolean(false), (0, class_validator_1.IsBoolean)(), (0, class_validator_1.IsOptional)()];
            _SMTP_USER_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SMTP_PASS_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SMTP_FROM_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _MOMO_PARTNER_CODE_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _MOMO_ACCESS_KEY_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _MOMO_SECRET_KEY_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _MOMO_REDIRECT_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _MOMO_IPN_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_API_TOKEN_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_BANK_ACCOUNT_UUID_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_API_BASE_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_VA_PREFIX_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_WEBHOOK_API_KEY_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_BANK_NAME_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_ACCOUNT_NUMBER_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_ACCOUNT_NAME_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _SEPAY_QR_BASE_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _AVATAR_STORAGE_BUCKET_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _AVATAR_STORAGE_ENDPOINT_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _AVATAR_STORAGE_ACCESS_KEY_ID_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _AVATAR_STORAGE_SECRET_ACCESS_KEY_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _AVATAR_STORAGE_REGION_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _AVATAR_STORAGE_PUBLIC_BASE_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _UIT_EVENTS_MAX_PAGES_decorators = [toOptionalNumber(10), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _UIT_EVENTS_INITIAL_PAGES_decorators = [toOptionalNumber(2), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _UIT_EVENTS_CACHE_TTL_MS_decorators = [toOptionalNumber(3600000), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _UIT_EVENTS_REQUEST_TIMEOUT_MS_decorators = [toOptionalNumber(20000), (0, class_validator_1.IsNumber)(), (0, class_validator_1.IsOptional)()];
            _TRACK_ASIA_SERVER_KEY_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _TRACK_ASIA_STYLE_URL_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            _OPEN_LIBRARY_USER_AGENT_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _NODE_ENV_decorators, { kind: "field", name: "NODE_ENV", static: false, private: false, access: { has: function (obj) { return "NODE_ENV" in obj; }, get: function (obj) { return obj.NODE_ENV; }, set: function (obj, value) { obj.NODE_ENV = value; } }, metadata: _metadata }, _NODE_ENV_initializers, _NODE_ENV_extraInitializers);
            __esDecorate(null, null, _PORT_decorators, { kind: "field", name: "PORT", static: false, private: false, access: { has: function (obj) { return "PORT" in obj; }, get: function (obj) { return obj.PORT; }, set: function (obj, value) { obj.PORT = value; } }, metadata: _metadata }, _PORT_initializers, _PORT_extraInitializers);
            __esDecorate(null, null, _DATABASE_URL_decorators, { kind: "field", name: "DATABASE_URL", static: false, private: false, access: { has: function (obj) { return "DATABASE_URL" in obj; }, get: function (obj) { return obj.DATABASE_URL; }, set: function (obj, value) { obj.DATABASE_URL = value; } }, metadata: _metadata }, _DATABASE_URL_initializers, _DATABASE_URL_extraInitializers);
            __esDecorate(null, null, _JWT_SECRET_decorators, { kind: "field", name: "JWT_SECRET", static: false, private: false, access: { has: function (obj) { return "JWT_SECRET" in obj; }, get: function (obj) { return obj.JWT_SECRET; }, set: function (obj, value) { obj.JWT_SECRET = value; } }, metadata: _metadata }, _JWT_SECRET_initializers, _JWT_SECRET_extraInitializers);
            __esDecorate(null, null, _JWT_EXPIRATION_decorators, { kind: "field", name: "JWT_EXPIRATION", static: false, private: false, access: { has: function (obj) { return "JWT_EXPIRATION" in obj; }, get: function (obj) { return obj.JWT_EXPIRATION; }, set: function (obj, value) { obj.JWT_EXPIRATION = value; } }, metadata: _metadata }, _JWT_EXPIRATION_initializers, _JWT_EXPIRATION_extraInitializers);
            __esDecorate(null, null, _JWT_REFRESH_EXPIRATION_decorators, { kind: "field", name: "JWT_REFRESH_EXPIRATION", static: false, private: false, access: { has: function (obj) { return "JWT_REFRESH_EXPIRATION" in obj; }, get: function (obj) { return obj.JWT_REFRESH_EXPIRATION; }, set: function (obj, value) { obj.JWT_REFRESH_EXPIRATION = value; } }, metadata: _metadata }, _JWT_REFRESH_EXPIRATION_initializers, _JWT_REFRESH_EXPIRATION_extraInitializers);
            __esDecorate(null, null, _CORS_ORIGIN_decorators, { kind: "field", name: "CORS_ORIGIN", static: false, private: false, access: { has: function (obj) { return "CORS_ORIGIN" in obj; }, get: function (obj) { return obj.CORS_ORIGIN; }, set: function (obj, value) { obj.CORS_ORIGIN = value; } }, metadata: _metadata }, _CORS_ORIGIN_initializers, _CORS_ORIGIN_extraInitializers);
            __esDecorate(null, null, _APP_BASE_URL_decorators, { kind: "field", name: "APP_BASE_URL", static: false, private: false, access: { has: function (obj) { return "APP_BASE_URL" in obj; }, get: function (obj) { return obj.APP_BASE_URL; }, set: function (obj, value) { obj.APP_BASE_URL = value; } }, metadata: _metadata }, _APP_BASE_URL_initializers, _APP_BASE_URL_extraInitializers);
            __esDecorate(null, null, _ATTENDANCE_TOKEN_TTL_SECONDS_decorators, { kind: "field", name: "ATTENDANCE_TOKEN_TTL_SECONDS", static: false, private: false, access: { has: function (obj) { return "ATTENDANCE_TOKEN_TTL_SECONDS" in obj; }, get: function (obj) { return obj.ATTENDANCE_TOKEN_TTL_SECONDS; }, set: function (obj, value) { obj.ATTENDANCE_TOKEN_TTL_SECONDS = value; } }, metadata: _metadata }, _ATTENDANCE_TOKEN_TTL_SECONDS_initializers, _ATTENDANCE_TOKEN_TTL_SECONDS_extraInitializers);
            __esDecorate(null, null, _REDIS_URL_decorators, { kind: "field", name: "REDIS_URL", static: false, private: false, access: { has: function (obj) { return "REDIS_URL" in obj; }, get: function (obj) { return obj.REDIS_URL; }, set: function (obj, value) { obj.REDIS_URL = value; } }, metadata: _metadata }, _REDIS_URL_initializers, _REDIS_URL_extraInitializers);
            __esDecorate(null, null, _IOT_SHARED_SECRET_decorators, { kind: "field", name: "IOT_SHARED_SECRET", static: false, private: false, access: { has: function (obj) { return "IOT_SHARED_SECRET" in obj; }, get: function (obj) { return obj.IOT_SHARED_SECRET; }, set: function (obj, value) { obj.IOT_SHARED_SECRET = value; } }, metadata: _metadata }, _IOT_SHARED_SECRET_initializers, _IOT_SHARED_SECRET_extraInitializers);
            __esDecorate(null, null, _IOT_MQTT_ENABLED_decorators, { kind: "field", name: "IOT_MQTT_ENABLED", static: false, private: false, access: { has: function (obj) { return "IOT_MQTT_ENABLED" in obj; }, get: function (obj) { return obj.IOT_MQTT_ENABLED; }, set: function (obj, value) { obj.IOT_MQTT_ENABLED = value; } }, metadata: _metadata }, _IOT_MQTT_ENABLED_initializers, _IOT_MQTT_ENABLED_extraInitializers);
            __esDecorate(null, null, _IOT_MQTT_BROKER_URL_decorators, { kind: "field", name: "IOT_MQTT_BROKER_URL", static: false, private: false, access: { has: function (obj) { return "IOT_MQTT_BROKER_URL" in obj; }, get: function (obj) { return obj.IOT_MQTT_BROKER_URL; }, set: function (obj, value) { obj.IOT_MQTT_BROKER_URL = value; } }, metadata: _metadata }, _IOT_MQTT_BROKER_URL_initializers, _IOT_MQTT_BROKER_URL_extraInitializers);
            __esDecorate(null, null, _IOT_MQTT_USERNAME_decorators, { kind: "field", name: "IOT_MQTT_USERNAME", static: false, private: false, access: { has: function (obj) { return "IOT_MQTT_USERNAME" in obj; }, get: function (obj) { return obj.IOT_MQTT_USERNAME; }, set: function (obj, value) { obj.IOT_MQTT_USERNAME = value; } }, metadata: _metadata }, _IOT_MQTT_USERNAME_initializers, _IOT_MQTT_USERNAME_extraInitializers);
            __esDecorate(null, null, _IOT_MQTT_PASSWORD_decorators, { kind: "field", name: "IOT_MQTT_PASSWORD", static: false, private: false, access: { has: function (obj) { return "IOT_MQTT_PASSWORD" in obj; }, get: function (obj) { return obj.IOT_MQTT_PASSWORD; }, set: function (obj, value) { obj.IOT_MQTT_PASSWORD = value; } }, metadata: _metadata }, _IOT_MQTT_PASSWORD_initializers, _IOT_MQTT_PASSWORD_extraInitializers);
            __esDecorate(null, null, _IOT_MQTT_CLIENT_ID_decorators, { kind: "field", name: "IOT_MQTT_CLIENT_ID", static: false, private: false, access: { has: function (obj) { return "IOT_MQTT_CLIENT_ID" in obj; }, get: function (obj) { return obj.IOT_MQTT_CLIENT_ID; }, set: function (obj, value) { obj.IOT_MQTT_CLIENT_ID = value; } }, metadata: _metadata }, _IOT_MQTT_CLIENT_ID_initializers, _IOT_MQTT_CLIENT_ID_extraInitializers);
            __esDecorate(null, null, _IOT_MQTT_TELEMETRY_TOPIC_decorators, { kind: "field", name: "IOT_MQTT_TELEMETRY_TOPIC", static: false, private: false, access: { has: function (obj) { return "IOT_MQTT_TELEMETRY_TOPIC" in obj; }, get: function (obj) { return obj.IOT_MQTT_TELEMETRY_TOPIC; }, set: function (obj, value) { obj.IOT_MQTT_TELEMETRY_TOPIC = value; } }, metadata: _metadata }, _IOT_MQTT_TELEMETRY_TOPIC_initializers, _IOT_MQTT_TELEMETRY_TOPIC_extraInitializers);
            __esDecorate(null, null, _SMTP_HOST_decorators, { kind: "field", name: "SMTP_HOST", static: false, private: false, access: { has: function (obj) { return "SMTP_HOST" in obj; }, get: function (obj) { return obj.SMTP_HOST; }, set: function (obj, value) { obj.SMTP_HOST = value; } }, metadata: _metadata }, _SMTP_HOST_initializers, _SMTP_HOST_extraInitializers);
            __esDecorate(null, null, _SMTP_PORT_decorators, { kind: "field", name: "SMTP_PORT", static: false, private: false, access: { has: function (obj) { return "SMTP_PORT" in obj; }, get: function (obj) { return obj.SMTP_PORT; }, set: function (obj, value) { obj.SMTP_PORT = value; } }, metadata: _metadata }, _SMTP_PORT_initializers, _SMTP_PORT_extraInitializers);
            __esDecorate(null, null, _SMTP_SECURE_decorators, { kind: "field", name: "SMTP_SECURE", static: false, private: false, access: { has: function (obj) { return "SMTP_SECURE" in obj; }, get: function (obj) { return obj.SMTP_SECURE; }, set: function (obj, value) { obj.SMTP_SECURE = value; } }, metadata: _metadata }, _SMTP_SECURE_initializers, _SMTP_SECURE_extraInitializers);
            __esDecorate(null, null, _SMTP_USER_decorators, { kind: "field", name: "SMTP_USER", static: false, private: false, access: { has: function (obj) { return "SMTP_USER" in obj; }, get: function (obj) { return obj.SMTP_USER; }, set: function (obj, value) { obj.SMTP_USER = value; } }, metadata: _metadata }, _SMTP_USER_initializers, _SMTP_USER_extraInitializers);
            __esDecorate(null, null, _SMTP_PASS_decorators, { kind: "field", name: "SMTP_PASS", static: false, private: false, access: { has: function (obj) { return "SMTP_PASS" in obj; }, get: function (obj) { return obj.SMTP_PASS; }, set: function (obj, value) { obj.SMTP_PASS = value; } }, metadata: _metadata }, _SMTP_PASS_initializers, _SMTP_PASS_extraInitializers);
            __esDecorate(null, null, _SMTP_FROM_decorators, { kind: "field", name: "SMTP_FROM", static: false, private: false, access: { has: function (obj) { return "SMTP_FROM" in obj; }, get: function (obj) { return obj.SMTP_FROM; }, set: function (obj, value) { obj.SMTP_FROM = value; } }, metadata: _metadata }, _SMTP_FROM_initializers, _SMTP_FROM_extraInitializers);
            __esDecorate(null, null, _MOMO_PARTNER_CODE_decorators, { kind: "field", name: "MOMO_PARTNER_CODE", static: false, private: false, access: { has: function (obj) { return "MOMO_PARTNER_CODE" in obj; }, get: function (obj) { return obj.MOMO_PARTNER_CODE; }, set: function (obj, value) { obj.MOMO_PARTNER_CODE = value; } }, metadata: _metadata }, _MOMO_PARTNER_CODE_initializers, _MOMO_PARTNER_CODE_extraInitializers);
            __esDecorate(null, null, _MOMO_ACCESS_KEY_decorators, { kind: "field", name: "MOMO_ACCESS_KEY", static: false, private: false, access: { has: function (obj) { return "MOMO_ACCESS_KEY" in obj; }, get: function (obj) { return obj.MOMO_ACCESS_KEY; }, set: function (obj, value) { obj.MOMO_ACCESS_KEY = value; } }, metadata: _metadata }, _MOMO_ACCESS_KEY_initializers, _MOMO_ACCESS_KEY_extraInitializers);
            __esDecorate(null, null, _MOMO_SECRET_KEY_decorators, { kind: "field", name: "MOMO_SECRET_KEY", static: false, private: false, access: { has: function (obj) { return "MOMO_SECRET_KEY" in obj; }, get: function (obj) { return obj.MOMO_SECRET_KEY; }, set: function (obj, value) { obj.MOMO_SECRET_KEY = value; } }, metadata: _metadata }, _MOMO_SECRET_KEY_initializers, _MOMO_SECRET_KEY_extraInitializers);
            __esDecorate(null, null, _MOMO_REDIRECT_URL_decorators, { kind: "field", name: "MOMO_REDIRECT_URL", static: false, private: false, access: { has: function (obj) { return "MOMO_REDIRECT_URL" in obj; }, get: function (obj) { return obj.MOMO_REDIRECT_URL; }, set: function (obj, value) { obj.MOMO_REDIRECT_URL = value; } }, metadata: _metadata }, _MOMO_REDIRECT_URL_initializers, _MOMO_REDIRECT_URL_extraInitializers);
            __esDecorate(null, null, _MOMO_IPN_URL_decorators, { kind: "field", name: "MOMO_IPN_URL", static: false, private: false, access: { has: function (obj) { return "MOMO_IPN_URL" in obj; }, get: function (obj) { return obj.MOMO_IPN_URL; }, set: function (obj, value) { obj.MOMO_IPN_URL = value; } }, metadata: _metadata }, _MOMO_IPN_URL_initializers, _MOMO_IPN_URL_extraInitializers);
            __esDecorate(null, null, _SEPAY_API_TOKEN_decorators, { kind: "field", name: "SEPAY_API_TOKEN", static: false, private: false, access: { has: function (obj) { return "SEPAY_API_TOKEN" in obj; }, get: function (obj) { return obj.SEPAY_API_TOKEN; }, set: function (obj, value) { obj.SEPAY_API_TOKEN = value; } }, metadata: _metadata }, _SEPAY_API_TOKEN_initializers, _SEPAY_API_TOKEN_extraInitializers);
            __esDecorate(null, null, _SEPAY_BANK_ACCOUNT_UUID_decorators, { kind: "field", name: "SEPAY_BANK_ACCOUNT_UUID", static: false, private: false, access: { has: function (obj) { return "SEPAY_BANK_ACCOUNT_UUID" in obj; }, get: function (obj) { return obj.SEPAY_BANK_ACCOUNT_UUID; }, set: function (obj, value) { obj.SEPAY_BANK_ACCOUNT_UUID = value; } }, metadata: _metadata }, _SEPAY_BANK_ACCOUNT_UUID_initializers, _SEPAY_BANK_ACCOUNT_UUID_extraInitializers);
            __esDecorate(null, null, _SEPAY_API_BASE_URL_decorators, { kind: "field", name: "SEPAY_API_BASE_URL", static: false, private: false, access: { has: function (obj) { return "SEPAY_API_BASE_URL" in obj; }, get: function (obj) { return obj.SEPAY_API_BASE_URL; }, set: function (obj, value) { obj.SEPAY_API_BASE_URL = value; } }, metadata: _metadata }, _SEPAY_API_BASE_URL_initializers, _SEPAY_API_BASE_URL_extraInitializers);
            __esDecorate(null, null, _SEPAY_VA_PREFIX_decorators, { kind: "field", name: "SEPAY_VA_PREFIX", static: false, private: false, access: { has: function (obj) { return "SEPAY_VA_PREFIX" in obj; }, get: function (obj) { return obj.SEPAY_VA_PREFIX; }, set: function (obj, value) { obj.SEPAY_VA_PREFIX = value; } }, metadata: _metadata }, _SEPAY_VA_PREFIX_initializers, _SEPAY_VA_PREFIX_extraInitializers);
            __esDecorate(null, null, _SEPAY_WEBHOOK_API_KEY_decorators, { kind: "field", name: "SEPAY_WEBHOOK_API_KEY", static: false, private: false, access: { has: function (obj) { return "SEPAY_WEBHOOK_API_KEY" in obj; }, get: function (obj) { return obj.SEPAY_WEBHOOK_API_KEY; }, set: function (obj, value) { obj.SEPAY_WEBHOOK_API_KEY = value; } }, metadata: _metadata }, _SEPAY_WEBHOOK_API_KEY_initializers, _SEPAY_WEBHOOK_API_KEY_extraInitializers);
            __esDecorate(null, null, _SEPAY_BANK_NAME_decorators, { kind: "field", name: "SEPAY_BANK_NAME", static: false, private: false, access: { has: function (obj) { return "SEPAY_BANK_NAME" in obj; }, get: function (obj) { return obj.SEPAY_BANK_NAME; }, set: function (obj, value) { obj.SEPAY_BANK_NAME = value; } }, metadata: _metadata }, _SEPAY_BANK_NAME_initializers, _SEPAY_BANK_NAME_extraInitializers);
            __esDecorate(null, null, _SEPAY_ACCOUNT_NUMBER_decorators, { kind: "field", name: "SEPAY_ACCOUNT_NUMBER", static: false, private: false, access: { has: function (obj) { return "SEPAY_ACCOUNT_NUMBER" in obj; }, get: function (obj) { return obj.SEPAY_ACCOUNT_NUMBER; }, set: function (obj, value) { obj.SEPAY_ACCOUNT_NUMBER = value; } }, metadata: _metadata }, _SEPAY_ACCOUNT_NUMBER_initializers, _SEPAY_ACCOUNT_NUMBER_extraInitializers);
            __esDecorate(null, null, _SEPAY_ACCOUNT_NAME_decorators, { kind: "field", name: "SEPAY_ACCOUNT_NAME", static: false, private: false, access: { has: function (obj) { return "SEPAY_ACCOUNT_NAME" in obj; }, get: function (obj) { return obj.SEPAY_ACCOUNT_NAME; }, set: function (obj, value) { obj.SEPAY_ACCOUNT_NAME = value; } }, metadata: _metadata }, _SEPAY_ACCOUNT_NAME_initializers, _SEPAY_ACCOUNT_NAME_extraInitializers);
            __esDecorate(null, null, _SEPAY_QR_BASE_URL_decorators, { kind: "field", name: "SEPAY_QR_BASE_URL", static: false, private: false, access: { has: function (obj) { return "SEPAY_QR_BASE_URL" in obj; }, get: function (obj) { return obj.SEPAY_QR_BASE_URL; }, set: function (obj, value) { obj.SEPAY_QR_BASE_URL = value; } }, metadata: _metadata }, _SEPAY_QR_BASE_URL_initializers, _SEPAY_QR_BASE_URL_extraInitializers);
            __esDecorate(null, null, _AVATAR_STORAGE_BUCKET_decorators, { kind: "field", name: "AVATAR_STORAGE_BUCKET", static: false, private: false, access: { has: function (obj) { return "AVATAR_STORAGE_BUCKET" in obj; }, get: function (obj) { return obj.AVATAR_STORAGE_BUCKET; }, set: function (obj, value) { obj.AVATAR_STORAGE_BUCKET = value; } }, metadata: _metadata }, _AVATAR_STORAGE_BUCKET_initializers, _AVATAR_STORAGE_BUCKET_extraInitializers);
            __esDecorate(null, null, _AVATAR_STORAGE_ENDPOINT_decorators, { kind: "field", name: "AVATAR_STORAGE_ENDPOINT", static: false, private: false, access: { has: function (obj) { return "AVATAR_STORAGE_ENDPOINT" in obj; }, get: function (obj) { return obj.AVATAR_STORAGE_ENDPOINT; }, set: function (obj, value) { obj.AVATAR_STORAGE_ENDPOINT = value; } }, metadata: _metadata }, _AVATAR_STORAGE_ENDPOINT_initializers, _AVATAR_STORAGE_ENDPOINT_extraInitializers);
            __esDecorate(null, null, _AVATAR_STORAGE_ACCESS_KEY_ID_decorators, { kind: "field", name: "AVATAR_STORAGE_ACCESS_KEY_ID", static: false, private: false, access: { has: function (obj) { return "AVATAR_STORAGE_ACCESS_KEY_ID" in obj; }, get: function (obj) { return obj.AVATAR_STORAGE_ACCESS_KEY_ID; }, set: function (obj, value) { obj.AVATAR_STORAGE_ACCESS_KEY_ID = value; } }, metadata: _metadata }, _AVATAR_STORAGE_ACCESS_KEY_ID_initializers, _AVATAR_STORAGE_ACCESS_KEY_ID_extraInitializers);
            __esDecorate(null, null, _AVATAR_STORAGE_SECRET_ACCESS_KEY_decorators, { kind: "field", name: "AVATAR_STORAGE_SECRET_ACCESS_KEY", static: false, private: false, access: { has: function (obj) { return "AVATAR_STORAGE_SECRET_ACCESS_KEY" in obj; }, get: function (obj) { return obj.AVATAR_STORAGE_SECRET_ACCESS_KEY; }, set: function (obj, value) { obj.AVATAR_STORAGE_SECRET_ACCESS_KEY = value; } }, metadata: _metadata }, _AVATAR_STORAGE_SECRET_ACCESS_KEY_initializers, _AVATAR_STORAGE_SECRET_ACCESS_KEY_extraInitializers);
            __esDecorate(null, null, _AVATAR_STORAGE_REGION_decorators, { kind: "field", name: "AVATAR_STORAGE_REGION", static: false, private: false, access: { has: function (obj) { return "AVATAR_STORAGE_REGION" in obj; }, get: function (obj) { return obj.AVATAR_STORAGE_REGION; }, set: function (obj, value) { obj.AVATAR_STORAGE_REGION = value; } }, metadata: _metadata }, _AVATAR_STORAGE_REGION_initializers, _AVATAR_STORAGE_REGION_extraInitializers);
            __esDecorate(null, null, _AVATAR_STORAGE_PUBLIC_BASE_URL_decorators, { kind: "field", name: "AVATAR_STORAGE_PUBLIC_BASE_URL", static: false, private: false, access: { has: function (obj) { return "AVATAR_STORAGE_PUBLIC_BASE_URL" in obj; }, get: function (obj) { return obj.AVATAR_STORAGE_PUBLIC_BASE_URL; }, set: function (obj, value) { obj.AVATAR_STORAGE_PUBLIC_BASE_URL = value; } }, metadata: _metadata }, _AVATAR_STORAGE_PUBLIC_BASE_URL_initializers, _AVATAR_STORAGE_PUBLIC_BASE_URL_extraInitializers);
            __esDecorate(null, null, _UIT_EVENTS_MAX_PAGES_decorators, { kind: "field", name: "UIT_EVENTS_MAX_PAGES", static: false, private: false, access: { has: function (obj) { return "UIT_EVENTS_MAX_PAGES" in obj; }, get: function (obj) { return obj.UIT_EVENTS_MAX_PAGES; }, set: function (obj, value) { obj.UIT_EVENTS_MAX_PAGES = value; } }, metadata: _metadata }, _UIT_EVENTS_MAX_PAGES_initializers, _UIT_EVENTS_MAX_PAGES_extraInitializers);
            __esDecorate(null, null, _UIT_EVENTS_INITIAL_PAGES_decorators, { kind: "field", name: "UIT_EVENTS_INITIAL_PAGES", static: false, private: false, access: { has: function (obj) { return "UIT_EVENTS_INITIAL_PAGES" in obj; }, get: function (obj) { return obj.UIT_EVENTS_INITIAL_PAGES; }, set: function (obj, value) { obj.UIT_EVENTS_INITIAL_PAGES = value; } }, metadata: _metadata }, _UIT_EVENTS_INITIAL_PAGES_initializers, _UIT_EVENTS_INITIAL_PAGES_extraInitializers);
            __esDecorate(null, null, _UIT_EVENTS_CACHE_TTL_MS_decorators, { kind: "field", name: "UIT_EVENTS_CACHE_TTL_MS", static: false, private: false, access: { has: function (obj) { return "UIT_EVENTS_CACHE_TTL_MS" in obj; }, get: function (obj) { return obj.UIT_EVENTS_CACHE_TTL_MS; }, set: function (obj, value) { obj.UIT_EVENTS_CACHE_TTL_MS = value; } }, metadata: _metadata }, _UIT_EVENTS_CACHE_TTL_MS_initializers, _UIT_EVENTS_CACHE_TTL_MS_extraInitializers);
            __esDecorate(null, null, _UIT_EVENTS_REQUEST_TIMEOUT_MS_decorators, { kind: "field", name: "UIT_EVENTS_REQUEST_TIMEOUT_MS", static: false, private: false, access: { has: function (obj) { return "UIT_EVENTS_REQUEST_TIMEOUT_MS" in obj; }, get: function (obj) { return obj.UIT_EVENTS_REQUEST_TIMEOUT_MS; }, set: function (obj, value) { obj.UIT_EVENTS_REQUEST_TIMEOUT_MS = value; } }, metadata: _metadata }, _UIT_EVENTS_REQUEST_TIMEOUT_MS_initializers, _UIT_EVENTS_REQUEST_TIMEOUT_MS_extraInitializers);
            __esDecorate(null, null, _TRACK_ASIA_SERVER_KEY_decorators, { kind: "field", name: "TRACK_ASIA_SERVER_KEY", static: false, private: false, access: { has: function (obj) { return "TRACK_ASIA_SERVER_KEY" in obj; }, get: function (obj) { return obj.TRACK_ASIA_SERVER_KEY; }, set: function (obj, value) { obj.TRACK_ASIA_SERVER_KEY = value; } }, metadata: _metadata }, _TRACK_ASIA_SERVER_KEY_initializers, _TRACK_ASIA_SERVER_KEY_extraInitializers);
            __esDecorate(null, null, _TRACK_ASIA_STYLE_URL_decorators, { kind: "field", name: "TRACK_ASIA_STYLE_URL", static: false, private: false, access: { has: function (obj) { return "TRACK_ASIA_STYLE_URL" in obj; }, get: function (obj) { return obj.TRACK_ASIA_STYLE_URL; }, set: function (obj, value) { obj.TRACK_ASIA_STYLE_URL = value; } }, metadata: _metadata }, _TRACK_ASIA_STYLE_URL_initializers, _TRACK_ASIA_STYLE_URL_extraInitializers);
            __esDecorate(null, null, _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_decorators, { kind: "field", name: "EXPO_PUBLIC_TRACK_ASIA_MAP_KEY", static: false, private: false, access: { has: function (obj) { return "EXPO_PUBLIC_TRACK_ASIA_MAP_KEY" in obj; }, get: function (obj) { return obj.EXPO_PUBLIC_TRACK_ASIA_MAP_KEY; }, set: function (obj, value) { obj.EXPO_PUBLIC_TRACK_ASIA_MAP_KEY = value; } }, metadata: _metadata }, _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_initializers, _EXPO_PUBLIC_TRACK_ASIA_MAP_KEY_extraInitializers);
            __esDecorate(null, null, _OPEN_LIBRARY_USER_AGENT_decorators, { kind: "field", name: "OPEN_LIBRARY_USER_AGENT", static: false, private: false, access: { has: function (obj) { return "OPEN_LIBRARY_USER_AGENT" in obj; }, get: function (obj) { return obj.OPEN_LIBRARY_USER_AGENT; }, set: function (obj, value) { obj.OPEN_LIBRARY_USER_AGENT = value; } }, metadata: _metadata }, _OPEN_LIBRARY_USER_AGENT_initializers, _OPEN_LIBRARY_USER_AGENT_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
function validate(config) {
    var validatedConfig = (0, class_transformer_1.plainToInstance)(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });
    var errors = (0, class_validator_1.validateSync)(validatedConfig, {
        skipMissingProperties: false,
    });
    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}
