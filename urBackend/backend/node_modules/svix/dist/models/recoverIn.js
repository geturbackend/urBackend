"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoverInSerializer = void 0;
exports.RecoverInSerializer = {
    _fromJsonObject(object) {
        return {
            since: new Date(object["since"]),
            until: object["until"] ? new Date(object["until"]) : null,
        };
    },
    _toJsonObject(self) {
        return {
            since: self.since,
            until: self.until,
        };
    },
};
//# sourceMappingURL=recoverIn.js.map