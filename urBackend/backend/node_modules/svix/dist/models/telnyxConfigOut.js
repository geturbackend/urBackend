"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelnyxConfigOutSerializer = void 0;
exports.TelnyxConfigOutSerializer = {
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
//# sourceMappingURL=telnyxConfigOut.js.map