"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingEndpointConsumerSeekInSerializer = void 0;
exports.PollingEndpointConsumerSeekInSerializer = {
    _fromJsonObject(object) {
        return {
            after: new Date(object["after"]),
        };
    },
    _toJsonObject(self) {
        return {
            after: self.after,
        };
    },
};
//# sourceMappingURL=pollingEndpointConsumerSeekIn.js.map