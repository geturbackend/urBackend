"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptFailedDataSerializer = void 0;
exports.MessageAttemptFailedDataSerializer = {
    _fromJsonObject(object) {
        return {
            id: object["id"],
            responseStatusCode: object["responseStatusCode"],
            timestamp: new Date(object["timestamp"]),
        };
    },
    _toJsonObject(self) {
        return {
            id: self.id,
            responseStatusCode: self.responseStatusCode,
            timestamp: self.timestamp,
        };
    },
};
//# sourceMappingURL=messageAttemptFailedData.js.map