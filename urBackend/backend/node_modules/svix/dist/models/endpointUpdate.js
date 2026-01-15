"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointUpdateSerializer = void 0;
exports.EndpointUpdateSerializer = {
    _fromJsonObject(object) {
        return {
            channels: object["channels"],
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
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
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            url: self.url,
            version: self.version,
        };
    },
};
//# sourceMappingURL=endpointUpdate.js.map