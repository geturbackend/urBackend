"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalWebhookEndpointHeadersInSerializer = void 0;
exports.OperationalWebhookEndpointHeadersInSerializer = {
    _fromJsonObject(object) {
        return {
            headers: object["headers"],
        };
    },
    _toJsonObject(self) {
        return {
            headers: self.headers,
        };
    },
};
//# sourceMappingURL=operationalWebhookEndpointHeadersIn.js.map