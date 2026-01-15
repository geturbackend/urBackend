"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTaskFinishedEventSerializer = void 0;
const backgroundTaskFinishedEvent2_1 = require("./backgroundTaskFinishedEvent2");
exports.BackgroundTaskFinishedEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: backgroundTaskFinishedEvent2_1.BackgroundTaskFinishedEvent2Serializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: backgroundTaskFinishedEvent2_1.BackgroundTaskFinishedEvent2Serializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=backgroundTaskFinishedEvent.js.map