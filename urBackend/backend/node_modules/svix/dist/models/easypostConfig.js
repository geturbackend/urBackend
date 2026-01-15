"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EasypostConfigSerializer = void 0;
exports.EasypostConfigSerializer = {
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
//# sourceMappingURL=easypostConfig.js.map