"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrumIoConfigOutSerializer = void 0;
exports.OrumIoConfigOutSerializer = {
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
//# sourceMappingURL=orumIoConfigOut.js.map