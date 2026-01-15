"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointTransformationInSerializer = void 0;
exports.EndpointTransformationInSerializer = {
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
//# sourceMappingURL=endpointTransformationIn.js.map