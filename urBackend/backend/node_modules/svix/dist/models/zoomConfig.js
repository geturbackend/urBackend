"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomConfigSerializer = void 0;
exports.ZoomConfigSerializer = {
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
//# sourceMappingURL=zoomConfig.js.map