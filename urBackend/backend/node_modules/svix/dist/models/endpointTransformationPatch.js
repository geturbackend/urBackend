"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointTransformationPatchSerializer = void 0;
exports.EndpointTransformationPatchSerializer = {
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
//# sourceMappingURL=endpointTransformationPatch.js.map