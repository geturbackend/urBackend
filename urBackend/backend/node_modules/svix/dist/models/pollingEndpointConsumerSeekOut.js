"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingEndpointConsumerSeekOutSerializer = void 0;
exports.PollingEndpointConsumerSeekOutSerializer = {
    _fromJsonObject(object) {
        return {
            iterator: object["iterator"],
        };
    },
    _toJsonObject(self) {
        return {
            iterator: self.iterator,
        };
    },
};
//# sourceMappingURL=pollingEndpointConsumerSeekOut.js.map