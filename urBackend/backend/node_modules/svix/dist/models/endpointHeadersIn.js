"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointHeadersInSerializer = void 0;
exports.EndpointHeadersInSerializer = {
    _fromJsonObject(object) {
        return {
            headers: object["headers"],
        };
    },
    _toJsonObject(self) {
        return {
            headers: self.headers,
        };
    },
};
//# sourceMappingURL=endpointHeadersIn.js.map