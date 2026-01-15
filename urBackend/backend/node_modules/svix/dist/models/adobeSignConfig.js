"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdobeSignConfigSerializer = void 0;
exports.AdobeSignConfigSerializer = {
    _fromJsonObject(object) {
        return {
            clientId: object["clientId"],
        };
    },
    _toJsonObject(self) {
        return {
            clientId: self.clientId,
        };
    },
};
//# sourceMappingURL=adobeSignConfig.js.map