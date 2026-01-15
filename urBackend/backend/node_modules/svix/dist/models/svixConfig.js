"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvixConfigSerializer = void 0;
exports.SvixConfigSerializer = {
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
//# sourceMappingURL=svixConfig.js.map