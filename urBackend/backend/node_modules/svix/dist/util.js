"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiException = void 0;
class ApiException extends Error {
    constructor(code, body, headers) {
        super(`HTTP-Code: ${code}\nHeaders: ${JSON.stringify(headers)}`);
        this.code = code;
        this.body = body;
        this.headers = {};
        headers.forEach((value, name) => {
            this.headers[name] = value;
        });
    }
}
exports.ApiException = ApiException;
//# sourceMappingURL=util.js.map