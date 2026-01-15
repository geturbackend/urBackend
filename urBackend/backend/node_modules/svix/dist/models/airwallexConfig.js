"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirwallexConfigSerializer = void 0;
exports.AirwallexConfigSerializer = {
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
//# sourceMappingURL=airwallexConfig.js.map