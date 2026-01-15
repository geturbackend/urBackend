"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointSecretOutSerializer = void 0;
exports.IngestEndpointSecretOutSerializer = {
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
//# sourceMappingURL=ingestEndpointSecretOut.js.map