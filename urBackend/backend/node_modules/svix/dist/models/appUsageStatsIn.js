"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppUsageStatsInSerializer = void 0;
exports.AppUsageStatsInSerializer = {
    _fromJsonObject(object) {
        return {
            appIds: object["appIds"],
            since: new Date(object["since"]),
            until: new Date(object["until"]),
        };
    },
    _toJsonObject(self) {
        return {
            appIds: self.appIds,
            since: self.since,
            until: self.until,
        };
    },
};
//# sourceMappingURL=appUsageStatsIn.js.map