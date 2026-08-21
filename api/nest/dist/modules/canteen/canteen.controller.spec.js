"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var shared_1 = require("@smart-campus/shared");
var roles_decorator_1 = require("../../common/decorators/roles.decorator");
var canteen_controller_1 = require("./canteen.controller");
function getMethodRoles(methodName) {
    return Reflect.getMetadata(roles_decorator_1.ROLES_KEY, canteen_controller_1.CanteenController.prototype[methodName]);
}
describe('CanteenController roles', function () {
    it('allows admin and super_admin on live admin mutations', function () {
        expect(getMethodRoles('getAdminCatalog')).toEqual([
            shared_1.USER_ROLES.CANTEEN_ADMIN,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
        expect(getMethodRoles('completeOrder')).toEqual([
            shared_1.USER_ROLES.CANTEEN_ADMIN,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
        expect(getMethodRoles('createCategory')).toEqual([
            shared_1.USER_ROLES.CANTEEN_ADMIN,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
        expect(getMethodRoles('updateCategory')).toEqual([
            shared_1.USER_ROLES.CANTEEN_ADMIN,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
        expect(getMethodRoles('createProduct')).toEqual([
            shared_1.USER_ROLES.CANTEEN_ADMIN,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
        expect(getMethodRoles('updateProduct')).toEqual([
            shared_1.USER_ROLES.CANTEEN_ADMIN,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
        expect(getMethodRoles('uploadProductImage')).toEqual([
            shared_1.USER_ROLES.CANTEEN_ADMIN,
            shared_1.USER_ROLES.ADMIN,
            shared_1.USER_ROLES.SUPER_ADMIN,
        ]);
    });
    it('restricts destructive canteen catalog mutations to admin and super_admin', function () {
        expect(getMethodRoles('deleteAdminOrder')).toEqual([shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN]);
        expect(getMethodRoles('removeCategory')).toEqual([shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN]);
        expect(getMethodRoles('removeProduct')).toEqual([shared_1.USER_ROLES.ADMIN, shared_1.USER_ROLES.SUPER_ADMIN]);
    });
    it('keeps student and lecturer in consumer flows only', function () {
        expect(getMethodRoles('createOrder')).toEqual([shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER]);
        expect(getMethodRoles('createPayment')).toEqual([shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER]);
        expect(getMethodRoles('createSepayPayment')).toEqual([shared_1.USER_ROLES.STUDENT, shared_1.USER_ROLES.LECTURER]);
    });
});
