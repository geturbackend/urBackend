"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointSecretRotateInSerializer = void 0;
exports.EndpointSecretRotateInSerializer = {
    _fromJsonObject(object) {
        return {
            key: object["key"],
        };
    },
    _toJsonObject(self) {
        return {
            key: self.key,
        };
    },
};
//# sourceMappingURL=endpointSecretRotateIn.js.map