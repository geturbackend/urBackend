"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VapiConfigSerializer = void 0;
exports.VapiConfigSerializer = {
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
//# sourceMappingURL=vapiConfig.js.map