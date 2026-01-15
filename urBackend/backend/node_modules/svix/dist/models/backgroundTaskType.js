"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTaskTypeSerializer = exports.BackgroundTaskType = void 0;
var BackgroundTaskType;
(function (BackgroundTaskType) {
    BackgroundTaskType["EndpointReplay"] = "endpoint.replay";
    BackgroundTaskType["EndpointRecover"] = "endpoint.recover";
    BackgroundTaskType["ApplicationStats"] = "application.stats";
    BackgroundTaskType["MessageBroadcast"] = "message.broadcast";
    BackgroundTaskType["SdkGenerate"] = "sdk.generate";
    BackgroundTaskType["EventTypeAggregate"] = "event-type.aggregate";
    BackgroundTaskType["ApplicationPurgeContent"] = "application.purge_content";
})(BackgroundTaskType = exports.BackgroundTaskType || (exports.BackgroundTaskType = {}));
exports.BackgroundTaskTypeSerializer = {
    _fromJsonObject(object) {
        return object;
    },
    _toJsonObject(self) {
        return self;
    },
};
//# sourceMappingURL=backgroundTaskType.js.map