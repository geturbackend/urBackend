"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointTransformationOutSerializer = void 0;
exports.EndpointTransformationOutSerializer = {
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
//# sourceMappingURL=endpointTransformationOut.js.map