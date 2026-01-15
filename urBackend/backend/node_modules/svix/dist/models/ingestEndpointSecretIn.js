"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointSecretInSerializer = void 0;
exports.IngestEndpointSecretInSerializer = {
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
//# sourceMappingURL=ingestEndpointSecretIn.js.map