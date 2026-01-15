"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttemptTriggerTypeSerializer = exports.MessageAttemptTriggerType = void 0;
var MessageAttemptTriggerType;
(function (MessageAttemptTriggerType) {
    MessageAttemptTriggerType[MessageAttemptTriggerType["Scheduled"] = 0] = "Scheduled";
    MessageAttemptTriggerType[MessageAttemptTriggerType["Manual"] = 1] = "Manual";
})(MessageAttemptTriggerType = exports.MessageAttemptTriggerType || (exports.MessageAttemptTriggerType = {}));
exports.MessageAttemptTriggerTypeSerializer = {
    _fromJsonObject(object) {
        return object;
    },
    _toJsonObject(self) {
        return self;
    },
};
//# sourceMappingURL=messageAttemptTriggerType.js.map