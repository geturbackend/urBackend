"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RotateTokenOutSerializer = void 0;
exports.RotateTokenOutSerializer = {
    _fromJsonObject(object) {
        return {
            ingestUrl: object["ingestUrl"],
        };
    },
    _toJsonObject(self) {
        return {
            ingestUrl: self.ingestUrl,
        };
    },
};
//# sourceMappingURL=rotateTokenOut.js.map