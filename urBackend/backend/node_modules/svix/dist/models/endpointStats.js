"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointStatsSerializer = void 0;
exports.EndpointStatsSerializer = {
    _fromJsonObject(object) {
        return {
            fail: object["fail"],
            pending: object["pending"],
            sending: object["sending"],
            success: object["success"],
        };
    },
    _toJsonObject(self) {
        return {
            fail: self.fail,
            pending: self.pending,
            sending: self.sending,
            success: self.success,
        };
    },
};
//# sourceMappingURL=endpointStats.js.map