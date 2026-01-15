"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPortalCapabilitySerializer = exports.AppPortalCapability = void 0;
var AppPortalCapability;
(function (AppPortalCapability) {
    AppPortalCapability["ViewBase"] = "ViewBase";
    AppPortalCapability["ViewEndpointSecret"] = "ViewEndpointSecret";
    AppPortalCapability["ManageEndpointSecret"] = "ManageEndpointSecret";
    AppPortalCapability["ManageTransformations"] = "ManageTransformations";
    AppPortalCapability["CreateAttempts"] = "CreateAttempts";
    AppPortalCapability["ManageEndpoint"] = "ManageEndpoint";
})(AppPortalCapability = exports.AppPortalCapability || (exports.AppPortalCapability = {}));
exports.AppPortalCapabilitySerializer = {
    _fromJsonObject(object) {
        return object;
    },
    _toJsonObject(self) {
        return self;
    },
};
//# sourceMappingURL=appPortalCapability.js.map