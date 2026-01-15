"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptOutSerializer = void 0;
const messageAttemptTriggerType_1 = require("./messageAttemptTriggerType");
const messageOut_1 = require("./messageOut");
const messageStatus_1 = require("./messageStatus");
const messageStatusText_1 = require("./messageStatusText");
exports.MessageAttemptOutSerializer = {
    _fromJsonObject(object) {
        return {
            endpointId: object["endpointId"],
            id: object["id"],
            msg: object["msg"]
                ? messageOut_1.MessageOutSerializer._fromJsonObject(object["msg"])
                : undefined,
            msgId: object["msgId"],
            response: object["response"],
            responseDurationMs: object["responseDurationMs"],
            responseStatusCode: object["responseStatusCode"],
            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
            statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
            timestamp: new Date(object["timestamp"]),
            triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._fromJsonObject(object["triggerType"]),
            url: object["url"],
        };
    },
    _toJsonObject(self) {
        return {
            endpointId: self.endpointId,
            id: self.id,
            msg: self.msg ? messageOut_1.MessageOutSerializer._toJsonObject(self.msg) : undefined,
            msgId: self.msgId,
            response: self.response,
            responseDurationMs: self.responseDurationMs,
            responseStatusCode: self.responseStatusCode,
            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
            statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
            timestamp: self.timestamp,
            triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._toJsonObject(self.triggerType),
            url: self.url,
        };
    },
};
//# sourceMappingURL=messageAttemptOut.js.map