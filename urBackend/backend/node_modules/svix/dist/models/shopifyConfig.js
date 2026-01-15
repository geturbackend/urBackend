"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopifyConfigSerializer = void 0;
exports.ShopifyConfigSerializer = {
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
//# sourceMappingURL=shopifyConfig.js.map