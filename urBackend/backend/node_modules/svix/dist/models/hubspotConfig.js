"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HubspotConfigSerializer = void 0;
exports.HubspotConfigSerializer = {
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
//# sourceMappingURL=hubspotConfig.js.map