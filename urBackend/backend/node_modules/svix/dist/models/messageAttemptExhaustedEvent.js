"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptExhaustedEventSerializer = void 0;
const messageAttemptExhaustedEventData_1 = require("./messageAttemptExhaustedEventData");
exports.MessageAttemptExhaustedEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: messageAttemptExhaustedEventData_1.MessageAttemptExhaustedEventDataSerializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: messageAttemptExhaustedEventData_1.MessageAttemptExhaustedEventDataSerializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=messageAttemptExhaustedEvent.js.map