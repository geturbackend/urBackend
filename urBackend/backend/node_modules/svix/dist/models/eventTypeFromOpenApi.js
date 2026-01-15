"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeFromOpenApiSerializer = void 0;
exports.EventTypeFromOpenApiSerializer = {
    _fromJsonObject(object) {
        return {
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            groupName: object["groupName"],
            name: object["name"],
            schemas: object["schemas"],
        };
    },
    _toJsonObject(self) {
        return {
            deprecated: self.deprecated,
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            groupName: self.groupName,
            name: self.name,
            schemas: self.schemas,
        };
    },
};
//# sourceMappingURL=eventTypeFromOpenApi.js.map