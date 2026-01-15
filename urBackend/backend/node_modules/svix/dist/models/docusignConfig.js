"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocusignConfigSerializer = void 0;
exports.DocusignConfigSerializer = {
    _fromJsonObject(object) {
        return {
            secret: object["secret"],
        };
    },
    _toJsonObject(self) {
        return {
            secret: self.secret,
        };
    },
};
//# sourceMappingURL=docusignConfig.js.map