"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationKeyOutSerializer = void 0;
exports.IntegrationKeyOutSerializer = {
    _fromJsonObject(object) {
        return {
            key: object["key"],
        };
    },
    _toJsonObject(self) {
        return {
            key: self.key,
        };
    },
};
//# sourceMappingURL=integrationKeyOut.js.map