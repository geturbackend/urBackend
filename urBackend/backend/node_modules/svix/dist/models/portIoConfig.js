"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortIoConfigSerializer = void 0;
exports.PortIoConfigSerializer = {
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
//# sourceMappingURL=portIoConfig.js.map