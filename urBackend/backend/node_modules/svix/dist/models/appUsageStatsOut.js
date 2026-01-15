"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppUsageStatsOutSerializer = void 0;
const backgroundTaskStatus_1 = require("./backgroundTaskStatus");
const backgroundTaskType_1 = require("./backgroundTaskType");
exports.AppUsageStatsOutSerializer = {
    _fromJsonObject(object) {
        return {
            id: object["id"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
            unresolvedAppIds: object["unresolvedAppIds"],
        };
    },
    _toJsonObject(self) {
        return {
            id: self.id,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
            unresolvedAppIds: self.unresolvedAppIds,
        };
    },
};
//# sourceMappingURL=appUsageStatsOut.js.map