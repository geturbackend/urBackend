"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackConfigSerializer = void 0;
exports.SlackConfigSerializer = {
    _fromJsonObject(object) {
        return {
            secret: object["secret"],
        };
    },
    _toJsonObject(self) {
        return {
            secret: self.secret,
        };
    },
};
//# sourceMappingURL=slackConfig.js.map