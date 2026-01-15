"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestEndpointHeadersInSerializer = void 0;
exports.IngestEndpointHeadersInSerializer = {
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
//# sourceMappingURL=ingestEndpointHeadersIn.js.map