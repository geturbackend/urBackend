"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointUpdateSerializer = void 0;
exports.IngestEndpointUpdateSerializer = {
    _fromJsonObject(object) {
        return {
            description: object["description"],
            disabled: object["disabled"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            url: object["url"],
        };
    },
    _toJsonObject(self) {
        return {
            description: self.description,
            disabled: self.disabled,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            url: self.url,
        };
    },
};
//# sourceMappingURL=ingestEndpointUpdate.js.map