"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VeriffConfigSerializer = void 0;
exports.VeriffConfigSerializer = {
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
//# sourceMappingURL=veriffConfig.js.map