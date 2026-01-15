"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalWebhookEndpointHeadersOutSerializer = void 0;
exports.OperationalWebhookEndpointHeadersOutSerializer = {
    _fromJsonObject(object) {
        return {
            headers: object["headers"],
            sensitive: object["sensitive"],
        };
    },
    _toJsonObject(self) {
        return {
            headers: self.headers,
            sensitive: self.sensitive,
        };
    },
};
//# sourceMappingURL=operationalWebhookEndpointHeadersOut.js.map