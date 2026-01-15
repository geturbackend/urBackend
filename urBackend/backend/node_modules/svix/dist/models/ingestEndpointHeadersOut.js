"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointHeadersOutSerializer = void 0;
exports.IngestEndpointHeadersOutSerializer = {
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
//# sourceMappingURL=ingestEndpointHeadersOut.js.map