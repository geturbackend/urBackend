"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalWebhookEndpointSecretOutSerializer = void 0;
exports.OperationalWebhookEndpointSecretOutSerializer = {
    _fromJsonObject(object) {
        return {
            key: object["key"],
        };
    },
    _toJsonObject(self) {
        return {
            key: self.key,
        };
    },
};
//# sourceMappingURL=operationalWebhookEndpointSecretOut.js.map