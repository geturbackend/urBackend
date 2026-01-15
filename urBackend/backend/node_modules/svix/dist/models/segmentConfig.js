"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentConfigSerializer = void 0;
exports.SegmentConfigSerializer = {
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
//# sourceMappingURL=segmentConfig.js.map