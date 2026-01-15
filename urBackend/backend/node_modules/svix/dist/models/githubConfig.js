"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubConfigSerializer = void 0;
exports.GithubConfigSerializer = {
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
//# sourceMappingURL=githubConfig.js.map