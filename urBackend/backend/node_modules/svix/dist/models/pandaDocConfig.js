"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PandaDocConfigSerializer = void 0;
exports.PandaDocConfigSerializer = {
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
//# sourceMappingURL=pandaDocConfig.js.map