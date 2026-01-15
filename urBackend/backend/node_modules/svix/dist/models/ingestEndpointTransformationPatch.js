"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointTransformationPatchSerializer = void 0;
exports.IngestEndpointTransformationPatchSerializer = {
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
//# sourceMappingURL=ingestEndpointTransformationPatch.js.map