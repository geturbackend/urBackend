"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardAccessOutSerializer = void 0;
exports.DashboardAccessOutSerializer = {
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
//# sourceMappingURL=dashboardAccessOut.js.map