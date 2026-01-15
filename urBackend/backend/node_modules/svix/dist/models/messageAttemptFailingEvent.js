"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptFailingEventSerializer = void 0;
const messageAttemptFailingEventData_1 = require("./messageAttemptFailingEventData");
exports.MessageAttemptFailingEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: messageAttemptFailingEventData_1.MessageAttemptFailingEventDataSerializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: messageAttemptFailingEventData_1.MessageAttemptFailingEventDataSerializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=messageAttemptFailingEvent.js.map