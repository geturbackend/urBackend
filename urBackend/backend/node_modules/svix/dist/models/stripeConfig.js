"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeConfigSerializer = void 0;
exports.StripeConfigSerializer = {
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
//# sourceMappingURL=stripeConfig.js.map