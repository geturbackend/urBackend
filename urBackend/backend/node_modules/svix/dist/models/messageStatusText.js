"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageStatusTextSerializer = exports.MessageStatusText = void 0;
var MessageStatusText;
(function (MessageStatusText) {
    MessageStatusText["Success"] = "success";
    MessageStatusText["Pending"] = "pending";
    MessageStatusText["Fail"] = "fail";
    MessageStatusText["Sending"] = "sending";
})(MessageStatusText = exports.MessageStatusText || (exports.MessageStatusText = {}));
exports.MessageStatusTextSerializer = {
    _fromJsonObject(object) {
        return object;
    },
    _toJsonObject(self) {
        return self;
    },
};
//# sourceMappingURL=messageStatusText.js.map