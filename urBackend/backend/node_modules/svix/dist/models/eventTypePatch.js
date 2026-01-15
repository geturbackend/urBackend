"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypePatchSerializer = void 0;
exports.EventTypePatchSerializer = {
    _fromJsonObject(object) {
        return {
            archived: object["archived"],
            deprecated: object["deprecated"],
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            groupName: object["groupName"],
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
            schemas: self.schemas,
        };
    },
};
//# sourceMappingURL=eventTypePatch.js.map