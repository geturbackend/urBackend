"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointTransformationOutSerializer = void 0;
exports.IngestEndpointTransformationOutSerializer = {
    _fromJsonObject(object) {
        return {
            code: object["code"],
            enabled: object["enabled"],
        };
    },
    _toJsonObject(self) {
        return {
            code: self.code,
            enabled: self.enabled,
        };
    },
};
//# sourceMappingURL=ingestEndpointTransformationOut.js.map