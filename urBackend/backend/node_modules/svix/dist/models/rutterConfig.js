"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RutterConfigSerializer = void 0;
exports.RutterConfigSerializer = {
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
//# sourceMappingURL=rutterConfig.js.map