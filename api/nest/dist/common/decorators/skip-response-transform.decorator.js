"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipResponseTransform = exports.SKIP_RESPONSE_TRANSFORM_KEY = void 0;
var common_1 = require("@nestjs/common");
exports.SKIP_RESPONSE_TRANSFORM_KEY = 'skipResponseTransform';
var SkipResponseTransform = function () { return (0, common_1.SetMetadata)(exports.SKIP_RESPONSE_TRANSFORM_KEY, true); };
exports.SkipResponseTransform = SkipResponseTransform;
