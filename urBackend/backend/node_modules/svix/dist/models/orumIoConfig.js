"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrumIoConfigSerializer = void 0;
exports.OrumIoConfigSerializer = {
    _fromJsonObject(object) {
        return {
            publicKey: object["publicKey"],
        };
    },
    _toJsonObject(self) {
        return {
            publicKey: self.publicKey,
        };
    },
};
//# sourceMappingURL=orumIoConfig.js.map