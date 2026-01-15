"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalWebhookEndpointSecretInSerializer = void 0;
exports.OperationalWebhookEndpointSecretInSerializer = {
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
//# sourceMappingURL=operationalWebhookEndpointSecretIn.js.map