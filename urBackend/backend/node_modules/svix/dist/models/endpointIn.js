"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointInSerializer = void 0;
exports.EndpointInSerializer = {
    _fromJsonObject(object) {
        return {
            channels: object["channels"],
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            headers: object["headers"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            secret: object["secret"],
            uid: object["uid"],
            url: object["url"],
            version: object["version"],
        };
    },
    _toJsonObject(self) {
        return {
            channels: self.channels,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            headers: self.headers,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            secret: self.secret,
            uid: self.uid,
            url: self.url,
            version: self.version,
        };
    },
};
//# sourceMappingURL=endpointIn.js.map