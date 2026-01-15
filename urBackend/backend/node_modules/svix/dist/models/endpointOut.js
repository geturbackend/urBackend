"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointOutSerializer = void 0;
exports.EndpointOutSerializer = {
    _fromJsonObject(object) {
        return {
            channels: object["channels"],
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            id: object["id"],
            metadata: object["metadata"],
            rateLimit: object["rateLimit"],
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
            url: object["url"],
            version: object["version"],
        };
    },
    _toJsonObject(self) {
        return {
            channels: self.channels,
            createdAt: self.createdAt,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            id: self.id,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            uid: self.uid,
            updatedAt: self.updatedAt,
            url: self.url,
            version: self.version,
        };
    },
};
//# sourceMappingURL=endpointOut.js.map