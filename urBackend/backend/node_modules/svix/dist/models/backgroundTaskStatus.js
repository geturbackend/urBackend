"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTaskStatusSerializer = exports.BackgroundTaskStatus = void 0;
var BackgroundTaskStatus;
(function (BackgroundTaskStatus) {
    BackgroundTaskStatus["Running"] = "running";
    BackgroundTaskStatus["Finished"] = "finished";
    BackgroundTaskStatus["Failed"] = "failed";
})(BackgroundTaskStatus = exports.BackgroundTaskStatus || (exports.BackgroundTaskStatus = {}));
exports.BackgroundTaskStatusSerializer = {
    _fromJsonObject(object) {
        return object;
    },
    _toJsonObject(self) {
        return self;
    },
};
//# sourceMappingURL=backgroundTaskStatus.js.map