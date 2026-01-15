"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointHeadersOutSerializer = void 0;
exports.EndpointHeadersOutSerializer = {
    _fromJsonObject(object) {
        return {
            headers: object["headers"],
            sensitive: object["sensitive"],
        };
    },
    _toJsonObject(self) {
        return {
            headers: self.headers,
            sensitive: self.sensitive,
        };
    },
};
//# sourceMappingURL=endpointHeadersOut.js.map