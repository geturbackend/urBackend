"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeInSerializer = void 0;
exports.EventTypeInSerializer = {
    _fromJsonObject(object) {
        return {
            archived: object["archived"],
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
            archived: self.archived,
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
//# sourceMappingURL=eventTypeIn.js.map