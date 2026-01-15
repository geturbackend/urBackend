"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalWebhookEndpointInSerializer = void 0;
exports.OperationalWebhookEndpointInSerializer = {
    _fromJsonObject(object) {
        return {
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
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
            filterTypes: self.filterTypes,
            metadata: self.metadata,
            rateLimit: self.rateLimit,
            secret: self.secret,
            uid: self.uid,
            url: self.url,
        };
    },
};
//# sourceMappingURL=operationalWebhookEndpointIn.js.map