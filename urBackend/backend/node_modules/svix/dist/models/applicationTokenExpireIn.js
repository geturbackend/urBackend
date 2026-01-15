"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationTokenExpireInSerializer = void 0;
exports.ApplicationTokenExpireInSerializer = {
    _fromJsonObject(object) {
        return {
            expiry: object["expiry"],
            sessionIds: object["sessionIds"],
        };
    },
    _toJsonObject(self) {
        return {
            expiry: self.expiry,
            sessionIds: self.sessionIds,
        };
    },
};
//# sourceMappingURL=applicationTokenExpireIn.js.map