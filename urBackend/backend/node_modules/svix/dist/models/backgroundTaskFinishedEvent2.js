"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTaskFinishedEvent2Serializer = void 0;
const backgroundTaskStatus_1 = require("./backgroundTaskStatus");
const backgroundTaskType_1 = require("./backgroundTaskType");
exports.BackgroundTaskFinishedEvent2Serializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"],
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
            taskId: object["taskId"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data,
            status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
            task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
            taskId: self.taskId,
        };
    },
};
//# sourceMappingURL=backgroundTaskFinishedEvent2.js.map