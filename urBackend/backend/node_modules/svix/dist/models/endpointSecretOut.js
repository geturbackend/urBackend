"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointSecretOutSerializer = void 0;
exports.EndpointSecretOutSerializer = {
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
//# sourceMappingURL=endpointSecretOut.js.map