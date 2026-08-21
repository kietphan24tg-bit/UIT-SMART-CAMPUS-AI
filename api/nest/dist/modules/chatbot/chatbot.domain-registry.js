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
exports.ChatbotDomainRegistry = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var chatbot_utils_1 = require("./chatbot.utils");
var DOMAIN_DEFINITIONS = [
    {
        id: 'schedule',
        label: 'Lịch học / Lịch dạy',
        description: 'Tra cứu lịch học, lịch dạy và buổi học trong ngày hoặc trong tuần.',
        route: '/schedule',
        actionLabel: 'Mở lịch',
        roles: [client_1.Role.student, client_1.Role.lecturer],
        keywords: ['schedule', 'lich', 'hoc', 'giang', 'tiet', 'lop'],
        phrases: ['lich hoc', 'lich day', 'hom nay hoc gi', 'tuan nay', 'tiet hoc'],
        knowledgeSlug: 'schedule-service',
    },
    {
        id: 'grades',
        label: 'Điểm & GPA',
        description: 'Theo dõi bảng điểm, GPA hoặc sheet nhập điểm theo lớp học phần.',
        route: '/services/grades',
        actionLabel: 'Mở điểm',
        roles: [client_1.Role.student, client_1.Role.lecturer],
        keywords: ['diem', 'gpa', 'grade', 'mon', 'bang'],
        phrases: ['bang diem', 'gpa hien tai', 'nhap diem', 'sheet diem'],
        knowledgeSlug: 'grades-service',
    },
    {
        id: 'attendance',
        label: 'Điểm danh',
        description: 'Theo dõi lịch sử điểm danh, phiên QR đang mở và lớp cần xử lý.',
        route: '/services/attendance',
        actionLabel: 'Mở điểm danh',
        roles: [client_1.Role.student, client_1.Role.lecturer],
        keywords: ['attendance', 'qr', 'checkin', 'vang', 'danh'],
        phrases: ['diem danh', 'qr attendance', 'phien qr', 'lich su diem danh'],
        knowledgeSlug: 'attendance-service',
    },
    {
        id: 'registrations',
        label: 'Đăng ký môn học',
        description: 'Tra cứu đăng ký môn, lớp học phần đang mở và số lượng lớp đã đăng ký.',
        route: '/services/course-registration',
        actionLabel: 'Mở đăng ký môn',
        roles: [client_1.Role.student],
        keywords: ['registration', 'dang', 'ky', 'hoc', 'phan', 'lop'],
        phrases: ['dang ky mon', 'dang ky hoc phan', 'lop dang mo'],
        knowledgeSlug: 'registration-service',
    },
    {
        id: 'study-materials',
        label: 'Tài liệu',
        description: 'Tra cứu đề thi, giáo trình và tài liệu học tập trong kho dùng chung.',
        route: '/services/study-materials',
        actionLabel: 'Mở tài liệu',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.admin, client_1.Role.super_admin],
        keywords: ['study', 'material', 'tai', 'lieu', 'de', 'thi', 'giao', 'trinh', 'pdf', 'doc'],
        phrases: ['tai lieu', 'de thi', 'giao trinh', 'tai lieu moi'],
        knowledgeSlug: 'study-materials-service',
    },
    {
        id: 'canteen',
        label: 'Canteen',
        description: 'Xem đơn gần nhất, menu còn hàng hoặc queue cần xử lý của canteen.',
        route: '/services/canteen',
        actionLabel: 'Mở canteen',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.canteen_admin, client_1.Role.admin, client_1.Role.super_admin],
        keywords: ['canteen', 'mon', 'an', 'menu', 'order', 'don'],
        phrases: ['don canteen', 'hoa don canteen', 'menu hom nay', 'mon nao con'],
        knowledgeSlug: 'canteen-service',
    },
    {
        id: 'library',
        label: 'Thư viện',
        description: 'Tra cứu sách đang mượn, yêu cầu mượn hoặc kết quả tìm sách.',
        route: '/services/library',
        actionLabel: 'Mở thư viện',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.admin, client_1.Role.super_admin],
        keywords: ['library', 'sach', 'muon', 'book', 'copy'],
        phrases: ['thu vien', 'muon sach', 'sach dang muon', 'tim sach'],
        knowledgeSlug: 'library-service',
    },
    {
        id: 'room-bookings',
        label: 'Đặt phòng',
        description: 'Theo dõi yêu cầu đặt phòng của tôi hoặc queue phê duyệt phòng.',
        route: '/services/room-booking',
        actionLabel: 'Mở đặt phòng',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.admin, client_1.Role.super_admin],
        keywords: ['room', 'booking', 'phong', 'hop', 'approve', 'queue'],
        phrases: ['dat phong', 'phong trong', 'queue phe duyet', 'yeu cau phong'],
        knowledgeSlug: 'room-booking-service',
    },
    {
        id: 'parking',
        label: 'Parking + IoT',
        description: 'Theo dõi xe đã đăng ký, phiên gửi xe đang mở, telemetry và chỗ trống.',
        route: '/services/parking',
        actionLabel: 'Mở parking',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.admin, client_1.Role.super_admin],
        keywords: ['parking', 'xe', 'gui', 'slot', 'telemetry', 'fire'],
        phrases: ['gui xe', 'cho trong', 'slot trong', 'cam bien', 'fire alert'],
        knowledgeSlug: 'parking-service',
    },
    {
        id: 'events',
        label: 'Sự kiện',
        description: 'Xem sự kiện sắp diễn ra và danh sách đăng ký sự kiện.',
        route: '/services/events',
        actionLabel: 'Mở sự kiện',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.admin, client_1.Role.super_admin],
        keywords: ['event', 'su', 'kien', 'workshop', 'dang', 'ky'],
        phrases: ['su kien sap toi', 'workshop', 'dang ky su kien'],
        knowledgeSlug: 'event-service',
    },
    {
        id: 'notifications',
        label: 'Cảnh báo',
        description: 'Theo dõi thông báo chưa đọc, cảnh báo học vụ, thanh toán và khẩn cấp.',
        route: '/alerts',
        actionLabel: 'Mở cảnh báo',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.admin, client_1.Role.super_admin, client_1.Role.canteen_admin],
        keywords: ['notification', 'alert', 'thong', 'bao', 'canh'],
        phrases: ['thong bao', 'chua doc', 'canh bao'],
        knowledgeSlug: 'notification-service',
    },
    {
        id: 'sos',
        label: 'GPS / SOS',
        description: 'Theo dõi yêu cầu SOS gần nhất hoặc danh sách SOS đang hoạt động.',
        route: '/services/gps-sos',
        actionLabel: 'Mở GPS/SOS',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.admin, client_1.Role.super_admin, client_1.Role.canteen_admin],
        keywords: ['sos', 'gps', 'emergency', 'khan', 'cap'],
        phrases: ['gps sos', 'yeu cau sos', 'khan cap'],
        knowledgeSlug: 'sos-service',
    },
    {
        id: 'ops',
        label: 'Vận hành',
        description: 'Snapshot vận hành gồm queue, telemetry, fire alert và tình trạng hỗ trợ.',
        route: '/services/admin-tools',
        actionLabel: 'Mở quản trị',
        roles: [client_1.Role.admin, client_1.Role.super_admin, client_1.Role.canteen_admin],
        keywords: ['ops', 'queue', 'fire', 'telemetry', 'van', 'hanh', 'admin'],
        phrases: ['van hanh', 'snapshot van hanh', 'queue phe duyet', 'fire alert'],
        knowledgeSlug: 'ops-service',
    },
    {
        id: 'campus-map',
        label: 'Bản đồ khuôn viên',
        description: 'Điều hướng tới tour 3D và thông tin tham quan khuôn viên UIT.',
        route: '/services/campus-map',
        actionLabel: 'Mở bản đồ',
        roles: [client_1.Role.student, client_1.Role.lecturer, client_1.Role.admin, client_1.Role.super_admin, client_1.Role.canteen_admin],
        keywords: ['map', 'ban', 'do', 'tour', '360', 'khuon', 'vien'],
        phrases: ['ban do khuon vien', 'tour 360', 'bai do uit'],
        knowledgeSlug: 'campus-map-service',
    },
];
var ChatbotDomainRegistry = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ChatbotDomainRegistry = _classThis = /** @class */ (function () {
        function ChatbotDomainRegistry_1() {
        }
        ChatbotDomainRegistry_1.prototype.getDomain = function (id) {
            var _a;
            return (_a = DOMAIN_DEFINITIONS.find(function (item) { return item.id === id; })) !== null && _a !== void 0 ? _a : null;
        };
        ChatbotDomainRegistry_1.prototype.getVisibleDomains = function (role) {
            return DOMAIN_DEFINITIONS.filter(function (item) { return item.roles.includes(role); });
        };
        ChatbotDomainRegistry_1.prototype.rankDomains = function (context) {
            var _this = this;
            var normalized = context.normalizedMessage;
            var visible = this.getVisibleDomains(context.role);
            return visible
                .map(function (domain) { return ({
                domain: domain,
                score: _this.scoreDomainMatch(domain, context.tokens, normalized),
            }); })
                .filter(function (item) { return item.score > 0; })
                .sort(function (a, b) { return b.score - a.score; })
                .map(function (item) { return item.domain; });
        };
        ChatbotDomainRegistry_1.prototype.buildDomainAction = function (domainId, route) {
            var domain = this.getDomain(domainId);
            if (!domain) {
                return (0, chatbot_utils_1.buildAction)('Mở dịch vụ', route !== null && route !== void 0 ? route : '/services');
            }
            return (0, chatbot_utils_1.buildAction)(domain.actionLabel, route !== null && route !== void 0 ? route : domain.route);
        };
        ChatbotDomainRegistry_1.prototype.buildActionsFromRoutes = function (routes) {
            return (0, chatbot_utils_1.uniqueStrings)(routes).map(function (route) {
                var _a;
                var matched = DOMAIN_DEFINITIONS.find(function (item) { return item.route === route; });
                return (0, chatbot_utils_1.buildAction)((_a = matched === null || matched === void 0 ? void 0 : matched.actionLabel) !== null && _a !== void 0 ? _a : 'Mở chi tiết', route);
            });
        };
        ChatbotDomainRegistry_1.prototype.getCapabilityScopes = function (role) {
            if (role === client_1.Role.student) {
                return [
                    {
                        scope: 'today',
                        label: 'Hôm nay của tôi',
                        description: 'Lịch học, điểm danh và thông báo gần nhất trong ngày.',
                    },
                    {
                        scope: 'work',
                        label: 'Học vụ của tôi',
                        description: 'Điểm, đăng ký môn và tài liệu học tập liên quan.',
                    },
                ];
            }
            if (role === client_1.Role.lecturer) {
                return [
                    {
                        scope: 'today',
                        label: 'Lịch dạy hôm nay',
                        description: 'Buổi dạy hôm nay, lớp cần điểm danh và thông báo liên quan.',
                    },
                    {
                        scope: 'work',
                        label: 'Lớp cần xử lý',
                        description: 'Lớp nhập điểm, tài liệu đã đăng và room booking liên quan.',
                    },
                ];
            }
            return [
                {
                    scope: 'ops',
                    label: 'Snapshot vận hành',
                    description: 'Queue, telemetry, fire alert và SOS đang hoạt động.',
                },
                {
                    scope: 'work',
                    label: 'Queue của tôi',
                    description: 'Các việc cần xử lý theo role quản trị hiện tại.',
                },
            ];
        };
        ChatbotDomainRegistry_1.prototype.scoreDomainMatch = function (domain, tokens, normalizedMessage) {
            var keywordScore = domain.keywords.reduce(function (score, keyword) { return score + (tokens.some(function (token) { return token.includes(keyword); }) ? 1 : 0); }, 0);
            var phraseScore = domain.phrases.reduce(function (score, phrase) {
                return score + (normalizedMessage.includes(phrase.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')) ? 3 : 0);
            }, 0);
            return keywordScore + phraseScore;
        };
        return ChatbotDomainRegistry_1;
    }());
    __setFunctionName(_classThis, "ChatbotDomainRegistry");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ChatbotDomainRegistry = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ChatbotDomainRegistry = _classThis;
}();
exports.ChatbotDomainRegistry = ChatbotDomainRegistry;
