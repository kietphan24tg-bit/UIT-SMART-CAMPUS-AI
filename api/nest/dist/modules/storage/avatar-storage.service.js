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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarStorageService = void 0;
var node_crypto_1 = require("node:crypto");
var common_1 = require("@nestjs/common");
var avatar_upload_constants_1 = require("./avatar-upload.constants");
var AvatarStorageService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AvatarStorageService = _classThis = /** @class */ (function () {
        function AvatarStorageService_1(configService) {
            this.configService = configService;
            this.bucket = this.configService.get('AVATAR_STORAGE_BUCKET', '').trim();
            this.endpoint = this.normalizeEndpoint(this.configService.get('AVATAR_STORAGE_ENDPOINT', '').trim());
            this.accessKeyId = this.configService.get('AVATAR_STORAGE_ACCESS_KEY_ID', '').trim();
            this.secretAccessKey = this.configService
                .get('AVATAR_STORAGE_SECRET_ACCESS_KEY', '')
                .trim();
            this.region = this.configService.get('AVATAR_STORAGE_REGION', 'us-east-1');
            this.publicBaseUrl = this.normalizeOptionalBaseUrl(this.configService.get('AVATAR_STORAGE_PUBLIC_BASE_URL', ''));
        }
        AvatarStorageService_1.prototype.uploadAvatar = function (userId, file) {
            return __awaiter(this, void 0, void 0, function () {
                var key, publicUrl;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            key = this.buildScopedImageKey(['avatars', userId], file.mimetype);
                            return [4 /*yield*/, this.uploadImageObject(key, file)];
                        case 1:
                            publicUrl = _a.sent();
                            return [2 /*return*/, {
                                    key: key,
                                    avatarUrl: publicUrl,
                                }];
                    }
                });
            });
        };
        AvatarStorageService_1.prototype.uploadCanteenProductImage = function (actorId, file) {
            return __awaiter(this, void 0, void 0, function () {
                var key, publicUrl;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            key = this.buildScopedImageKey(['canteen-products', actorId], file.mimetype);
                            return [4 /*yield*/, this.uploadImageObject(key, file)];
                        case 1:
                            publicUrl = _a.sent();
                            return [2 /*return*/, {
                                    key: key,
                                    imageUrl: publicUrl,
                                }];
                    }
                });
            });
        };
        AvatarStorageService_1.prototype.uploadLibraryBookCover = function (actorId, file) {
            return __awaiter(this, void 0, void 0, function () {
                var key, publicUrl;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            key = this.buildScopedImageKey(['library-books', actorId], file.mimetype);
                            return [4 /*yield*/, this.uploadImageObject(key, file)];
                        case 1:
                            publicUrl = _a.sent();
                            return [2 /*return*/, {
                                    key: key,
                                    imageUrl: publicUrl,
                                }];
                    }
                });
            });
        };
        AvatarStorageService_1.prototype.uploadStudyMaterialFile = function (actorId, file) {
            return __awaiter(this, void 0, void 0, function () {
                var key, publicUrl;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            key = this.buildScopedFileKey(['study-materials', actorId], file.mimetype);
                            return [4 /*yield*/, this.uploadFileObject(key, file)];
                        case 1:
                            publicUrl = _a.sent();
                            return [2 /*return*/, {
                                    key: key,
                                    fileUrl: publicUrl,
                                }];
                    }
                });
            });
        };
        AvatarStorageService_1.prototype.uploadImageObject = function (key, file) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.assertValidImageFile(file);
                    return [2 /*return*/, this.uploadObject(key, file)];
                });
            });
        };
        AvatarStorageService_1.prototype.uploadFileObject = function (key, file) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.assertValidStudyMaterialFile(file);
                    return [2 /*return*/, this.uploadObject(key, file)];
                });
            });
        };
        AvatarStorageService_1.prototype.uploadObject = function (key, file) {
            return __awaiter(this, void 0, void 0, function () {
                var requestUrl, payloadHash, amzDate, dateStamp, canonicalRequest, stringToSign, signature, authorization, response, responseBody;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.assertStorageConfigured();
                            requestUrl = this.buildObjectUrl(key);
                            payloadHash = this.sha256Hex(file.buffer);
                            amzDate = this.getAmzDate(new Date());
                            dateStamp = amzDate.slice(0, 8);
                            canonicalRequest = this.buildCanonicalRequest(requestUrl, file.mimetype, payloadHash, amzDate);
                            stringToSign = this.buildStringToSign(amzDate, dateStamp, canonicalRequest);
                            signature = (0, node_crypto_1.createHmac)('sha256', this.getSignatureKey(this.secretAccessKey, dateStamp, this.region, 's3'))
                                .update(stringToSign)
                                .digest('hex');
                            authorization = "AWS4-HMAC-SHA256 Credential=".concat(this.accessKeyId, "/").concat(dateStamp, "/").concat(this.region, "/s3/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=").concat(signature);
                            return [4 /*yield*/, fetch(requestUrl.toString(), {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': file.mimetype,
                                        'x-amz-content-sha256': payloadHash,
                                        'x-amz-date': amzDate,
                                        Authorization: authorization,
                                    },
                                    body: file.buffer,
                                })];
                        case 1:
                            response = _a.sent();
                            if (!!response.ok) return [3 /*break*/, 3];
                            return [4 /*yield*/, response.text().catch(function () { return ''; })];
                        case 2:
                            responseBody = _a.sent();
                            throw new common_1.BadGatewayException(responseBody
                                ? "Avatar storage rejected the upload: ".concat(response.status, " ").concat(response.statusText)
                                : "Avatar storage rejected the upload: ".concat(response.status));
                        case 3: return [2 /*return*/, this.buildPublicUrl(key)];
                    }
                });
            });
        };
        AvatarStorageService_1.prototype.buildScopedImageKey = function (pathSegments, mimetype) {
            return this.buildScopedFileKey(pathSegments, mimetype);
        };
        AvatarStorageService_1.prototype.buildScopedFileKey = function (pathSegments, mimetype) {
            var extension = this.resolveExtension(mimetype);
            return "".concat(pathSegments.join('/'), "/").concat((0, node_crypto_1.randomUUID)(), ".").concat(extension);
        };
        AvatarStorageService_1.prototype.assertValidImageFile = function (file) {
            if (!(file === null || file === void 0 ? void 0 : file.buffer) || !file.size) {
                throw new common_1.BadRequestException('Avatar file is required');
            }
            if (file.size > avatar_upload_constants_1.MAX_AVATAR_UPLOAD_SIZE_BYTES) {
                throw new common_1.BadRequestException('Avatar image must be 5 MB or smaller');
            }
            if (!avatar_upload_constants_1.ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
                throw new common_1.BadRequestException('Only JPEG, PNG, and WebP images are allowed');
            }
        };
        AvatarStorageService_1.prototype.assertValidStudyMaterialFile = function (file) {
            if (!(file === null || file === void 0 ? void 0 : file.buffer) || !file.size) {
                throw new common_1.BadRequestException('Study material file is required');
            }
            if (file.size > avatar_upload_constants_1.MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES) {
                throw new common_1.BadRequestException('Study material file must be 100 MB or smaller');
            }
            if (!avatar_upload_constants_1.ALLOWED_STUDY_MATERIAL_MIME_TYPES.has(file.mimetype)) {
                throw new common_1.BadRequestException('Only JPG, PNG, WebP, PDF, DOC, and DOCX files are allowed');
            }
        };
        AvatarStorageService_1.prototype.resolveExtension = function (mimetype) {
            var _a;
            var extension = (_a = avatar_upload_constants_1.ALLOWED_AVATAR_MIME_TYPES.get(mimetype)) !== null && _a !== void 0 ? _a : avatar_upload_constants_1.ALLOWED_STUDY_MATERIAL_MIME_TYPES.get(mimetype);
            if (!extension) {
                throw new common_1.BadRequestException('Unsupported upload file type');
            }
            return extension;
        };
        AvatarStorageService_1.prototype.buildCanonicalRequest = function (requestUrl, contentType, payloadHash, amzDate) {
            var canonicalHeaders = [
                "content-type:".concat(contentType),
                "host:".concat(requestUrl.host),
                "x-amz-content-sha256:".concat(payloadHash),
                "x-amz-date:".concat(amzDate),
                '',
            ].join('\n');
            return [
                'PUT',
                requestUrl.pathname,
                '',
                canonicalHeaders,
                'content-type;host;x-amz-content-sha256;x-amz-date',
                payloadHash,
            ].join('\n');
        };
        AvatarStorageService_1.prototype.buildStringToSign = function (amzDate, dateStamp, canonicalRequest) {
            return [
                'AWS4-HMAC-SHA256',
                amzDate,
                "".concat(dateStamp, "/").concat(this.region, "/s3/aws4_request"),
                this.sha256Hex(Buffer.from(canonicalRequest, 'utf8')),
            ].join('\n');
        };
        AvatarStorageService_1.prototype.buildObjectUrl = function (key) {
            var url = new URL(this.endpoint);
            url.pathname = this.joinPath.apply(this, __spreadArray([url.pathname,
                this.bucket], key.split('/').map(function (part) { return encodeURIComponent(part); }), false));
            url.search = '';
            return url;
        };
        AvatarStorageService_1.prototype.buildPublicUrl = function (key) {
            if (this.publicBaseUrl) {
                return new URL(key, this.ensureTrailingSlash(this.publicBaseUrl)).toString();
            }
            return this.buildObjectUrl(key).toString();
        };
        AvatarStorageService_1.prototype.getSignatureKey = function (secretKey, dateStamp, regionName, serviceName) {
            var kDate = (0, node_crypto_1.createHmac)('sha256', "AWS4".concat(secretKey)).update(dateStamp).digest();
            var kRegion = (0, node_crypto_1.createHmac)('sha256', kDate).update(regionName).digest();
            var kService = (0, node_crypto_1.createHmac)('sha256', kRegion).update(serviceName).digest();
            return (0, node_crypto_1.createHmac)('sha256', kService).update('aws4_request').digest();
        };
        AvatarStorageService_1.prototype.sha256Hex = function (value) {
            return (0, node_crypto_1.createHash)('sha256').update(value).digest('hex');
        };
        AvatarStorageService_1.prototype.getAmzDate = function (date) {
            var pad = function (value) { return String(value).padStart(2, '0'); };
            return [
                date.getUTCFullYear(),
                pad(date.getUTCMonth() + 1),
                pad(date.getUTCDate()),
                'T',
                pad(date.getUTCHours()),
                pad(date.getUTCMinutes()),
                pad(date.getUTCSeconds()),
                'Z',
            ].join('');
        };
        AvatarStorageService_1.prototype.joinPath = function () {
            var parts = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                parts[_i] = arguments[_i];
            }
            var normalized = parts
                .filter(function (part) { return part !== ''; })
                .map(function (part, index) {
                if (index === 0) {
                    return part.replace(/\/+$/g, '');
                }
                return part.replace(/^\/+|\/+$/g, '');
            })
                .filter(function (part) { return part.length > 0; });
            var path = normalized.join('/');
            return path.startsWith('/') ? path : "/".concat(path);
        };
        AvatarStorageService_1.prototype.ensureTrailingSlash = function (value) {
            return value.endsWith('/') ? value : "".concat(value, "/");
        };
        AvatarStorageService_1.prototype.normalizeEndpoint = function (value) {
            if (!value) {
                return '';
            }
            var url = new URL(value);
            return url.toString().replace(/\/+$/g, '');
        };
        AvatarStorageService_1.prototype.normalizeOptionalBaseUrl = function (value) {
            if (!value) {
                return null;
            }
            return this.normalizeEndpoint(value);
        };
        AvatarStorageService_1.prototype.assertStorageConfigured = function () {
            if (!this.bucket || !this.endpoint || !this.accessKeyId || !this.secretAccessKey) {
                throw new common_1.ServiceUnavailableException('Avatar storage is not configured');
            }
        };
        return AvatarStorageService_1;
    }());
    __setFunctionName(_classThis, "AvatarStorageService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AvatarStorageService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AvatarStorageService = _classThis;
}();
exports.AvatarStorageService = AvatarStorageService;
