"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckbookConfigSerializer = void 0;
exports.CheckbookConfigSerializer = {
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
//# sourceMappingURL=checkbookConfig.js.map