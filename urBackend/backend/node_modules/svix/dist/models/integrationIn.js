"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationInSerializer = void 0;
exports.IntegrationInSerializer = {
    _fromJsonObject(object) {
        return {
            featureFlags: object["featureFlags"],
            name: object["name"],
        };
    },
    _toJsonObject(self) {
        return {
            featureFlags: self.featureFlags,
            name: self.name,
        };
    },
};
//# sourceMappingURL=integrationIn.js.map