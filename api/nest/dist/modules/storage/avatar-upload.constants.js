"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_STUDY_MATERIAL_MIME_TYPES = exports.ALLOWED_AVATAR_MIME_TYPES = exports.MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES = exports.MAX_AVATAR_UPLOAD_SIZE_BYTES = void 0;
exports.MAX_AVATAR_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
exports.MAX_STUDY_MATERIAL_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;
exports.ALLOWED_AVATAR_MIME_TYPES = new Map([
    ['image/jpeg', 'jpg'],
    ['image/jpg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
]);
exports.ALLOWED_STUDY_MATERIAL_MIME_TYPES = new Map([
    ['image/jpeg', 'jpg'],
    ['image/jpg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['application/pdf', 'pdf'],
    ['application/msword', 'doc'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
]);
