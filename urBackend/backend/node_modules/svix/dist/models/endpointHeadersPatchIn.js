"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointHeadersPatchInSerializer = void 0;
exports.EndpointHeadersPatchInSerializer = {
    _fromJsonObject(object) {
        return {
            deleteHeaders: object["deleteHeaders"],
            headers: object["headers"],
        };
    },
    _toJsonObject(self) {
        return {
            deleteHeaders: self.deleteHeaders,
            headers: self.headers,
        };
    },
};
//# sourceMappingURL=endpointHeadersPatchIn.js.map