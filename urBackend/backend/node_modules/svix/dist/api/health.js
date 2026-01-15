"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Health = void 0;
const request_1 = require("../request");
class Health {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    get() {
        const request = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/health");
        return request.sendNoResponseBody(this.requestCtx);
    }
}
exports.Health = Health;
//# sourceMappingURL=health.js.map