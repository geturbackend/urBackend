"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationOutSerializer = void 0;
exports.IntegrationOutSerializer = {
    _fromJsonObject(object) {
        return {
            createdAt: new Date(object["createdAt"]),
            featureFlags: object["featureFlags"],
            id: object["id"],
            name: object["name"],
            updatedAt: new Date(object["updatedAt"]),
        };
    },
    _toJsonObject(self) {
        return {
            createdAt: self.createdAt,
            featureFlags: self.featureFlags,
            id: self.id,
            name: self.name,
            updatedAt: self.updatedAt,
        };
    },
};
//# sourceMappingURL=integrationOut.js.map