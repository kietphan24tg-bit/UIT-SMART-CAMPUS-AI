"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var study_materials_controller_1 = require("./study-materials.controller");
function getMethodRoles(methodName) {
    return Reflect.getMetadata(roles_decorator_1.ROLES_KEY, study_materials_controller_1.StudyMaterialsController.prototype[methodName]);
}
describe('StudyMaterialsController roles', function () {
    it('allows student and lecturer to create materials', function () {
        expect(getMethodRoles('create')).toEqual([shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER]);
    });
    it('allows all authenticated academic roles to list materials', function () {
        expect(getMethodRoles('list')).toEqual([
            shared_1.USER_ROLES.STUDENT,
            shared_1.USER_ROLES.LECTURER,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
    });
    it('allows owner paths and admin paths on update/delete', function () {
        expect(getMethodRoles('update')).toEqual([
            shared_1.USER_ROLES.STUDENT,
            shared_1.USER_ROLES.LECTURER,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
        expect(getMethodRoles('remove')).toEqual([
            shared_1.USER_ROLES.STUDENT,
            shared_1.USER_ROLES.LECTURER,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
    });
});
