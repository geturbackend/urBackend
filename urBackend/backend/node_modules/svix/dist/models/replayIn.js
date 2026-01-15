"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayInSerializer = void 0;
exports.ReplayInSerializer = {
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
//# sourceMappingURL=replayIn.js.map