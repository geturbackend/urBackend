"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointInSerializer = void 0;
exports.IngestEndpointInSerializer = {
    _fromJsonObject(object) {
        return {
            description: object["description"],
            disabled: object["disabled"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            secret: object["secret"],
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
            secret: self.secret,
            uid: self.uid,
            url: self.url,
        };
    },
};
//# sourceMappingURL=ingestEndpointIn.js.map