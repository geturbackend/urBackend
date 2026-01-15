"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationUpdateSerializer = void 0;
exports.IntegrationUpdateSerializer = {
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
//# sourceMappingURL=integrationUpdate.js.map