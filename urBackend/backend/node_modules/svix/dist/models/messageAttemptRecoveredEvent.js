"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptRecoveredEventSerializer = void 0;
const messageAttemptRecoveredEventData_1 = require("./messageAttemptRecoveredEventData");
exports.MessageAttemptRecoveredEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: messageAttemptRecoveredEventData_1.MessageAttemptRecoveredEventDataSerializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: messageAttemptRecoveredEventData_1.MessageAttemptRecoveredEventDataSerializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=messageAttemptRecoveredEvent.js.map