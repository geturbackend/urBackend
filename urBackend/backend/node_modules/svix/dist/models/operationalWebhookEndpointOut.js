"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalWebhookEndpointOutSerializer = void 0;
exports.OperationalWebhookEndpointOutSerializer = {
    _fromJsonObject(object) {
        return {
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
        };
    },
    _toJsonObject(self) {
        return {
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
        };
    },
};
//# sourceMappingURL=operationalWebhookEndpointOut.js.map