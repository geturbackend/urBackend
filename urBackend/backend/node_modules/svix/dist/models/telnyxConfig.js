"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelnyxConfigSerializer = void 0;
exports.TelnyxConfigSerializer = {
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
//# sourceMappingURL=telnyxConfig.js.map