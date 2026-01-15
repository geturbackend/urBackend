"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeOutSerializer = void 0;
exports.EventTypeOutSerializer = {
    _fromJsonObject(object) {
        return {
            archived: object["archived"],
            createdAt: new Date(object["createdAt"]),
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            groupName: object["groupName"],
            name: object["name"],
            schemas: object["schemas"],
            updatedAt: new Date(object["updatedAt"]),
        };
    },
    _toJsonObject(self) {
        return {
            archived: self.archived,
            createdAt: self.createdAt,
            deprecated: self.deprecated,
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            groupName: self.groupName,
            name: self.name,
            schemas: self.schemas,
            updatedAt: self.updatedAt,
        };
    },
};
//# sourceMappingURL=eventTypeOut.js.map