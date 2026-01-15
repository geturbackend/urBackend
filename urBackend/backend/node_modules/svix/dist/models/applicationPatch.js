"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationPatchSerializer = void 0;
exports.ApplicationPatchSerializer = {
    _fromJsonObject(object) {
        return {
            metadata: object["metadata"],
            name: object["name"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
        };
    },
    _toJsonObject(self) {
        return {
            metadata: self.metadata,
            name: self.name,
            rateLimit: self.rateLimit,
            uid: self.uid,
        };
    },
};
//# sourceMappingURL=applicationPatch.js.map