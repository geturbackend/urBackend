"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPortalAccessOutSerializer = void 0;
exports.AppPortalAccessOutSerializer = {
    _fromJsonObject(object) {
        return {
            token: object["token"],
            url: object["url"],
        };
    },
    _toJsonObject(self) {
        return {
            token: self.token,
            url: self.url,
        };
    },
};
//# sourceMappingURL=appPortalAccessOut.js.map