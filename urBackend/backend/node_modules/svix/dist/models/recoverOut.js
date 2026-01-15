"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoverOutSerializer = void 0;
const backgroundTaskStatus_1 = require("./backgroundTaskStatus");
const backgroundTaskType_1 = require("./backgroundTaskType");
exports.RecoverOutSerializer = {
    _fromJsonObject(object) {
        return {
            id: object["id"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
        };
    },
    _toJsonObject(self) {
        return {
            id: self.id,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
        };
    },
};
//# sourceMappingURL=recoverOut.js.map