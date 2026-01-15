"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronConfigSerializer = void 0;
exports.CronConfigSerializer = {
    _fromJsonObject(object) {
        return {
            contentType: object["contentType"],
            payload: object["payload"],
            schedule: object["schedule"],
        };
    },
    _toJsonObject(self) {
        return {
            contentType: self.contentType,
            payload: self.payload,
            schedule: self.schedule,
        };
    },
};
//# sourceMappingURL=cronConfig.js.map