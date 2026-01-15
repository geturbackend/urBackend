"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptExhaustedEventDataSerializer = void 0;
const messageAttemptFailedData_1 = require("./messageAttemptFailedData");
exports.MessageAttemptExhaustedEventDataSerializer = {
    _fromJsonObject(object) {
        return {
            appId: object["appId"],
            appUid: object["appUid"],
            endpointId: object["endpointId"],
            lastAttempt: messageAttemptFailedData_1.MessageAttemptFailedDataSerializer._fromJsonObject(object["lastAttempt"]),
            msgEventId: object["msgEventId"],
            msgId: object["msgId"],
        };
    },
    _toJsonObject(self) {
        return {
            appId: self.appId,
            appUid: self.appUid,
            endpointId: self.endpointId,
            lastAttempt: messageAttemptFailedData_1.MessageAttemptFailedDataSerializer._toJsonObject(self.lastAttempt),
            msgEventId: self.msgEventId,
            msgId: self.msgId,
        };
    },
};
//# sourceMappingURL=messageAttemptExhaustedEventData.js.map