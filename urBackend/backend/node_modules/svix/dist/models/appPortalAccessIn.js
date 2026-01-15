"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPortalAccessInSerializer = void 0;
const appPortalCapability_1 = require("./appPortalCapability");
const applicationIn_1 = require("./applicationIn");
exports.AppPortalAccessInSerializer = {
    _fromJsonObject(object) {
        var _a;
        return {
            application: object["application"]
                ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"])
                : undefined,
            capabilities: (_a = object["capabilities"]) === null || _a === void 0 ? void 0 : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._fromJsonObject(item)),
            expiry: object["expiry"],
            featureFlags: object["featureFlags"],
            readOnly: object["readOnly"],
            sessionId: object["sessionId"],
        };
    },
    _toJsonObject(self) {
        var _a;
        return {
            application: self.application
                ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application)
                : undefined,
            capabilities: (_a = self.capabilities) === null || _a === void 0 ? void 0 : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._toJsonObject(item)),
            expiry: self.expiry,
            featureFlags: self.featureFlags,
            readOnly: self.readOnly,
            sessionId: self.sessionId,
        };
    },
};
//# sourceMappingURL=appPortalAccessIn.js.map