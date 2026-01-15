"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
const environmentIn_1 = require("../models/environmentIn");
const environmentOut_1 = require("../models/environmentOut");
const request_1 = require("../request");
class Environment {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    export(options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/export");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        return request.send(this.requestCtx, environmentOut_1.EnvironmentOutSerializer._fromJsonObject);
    }
    import(environmentIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/import");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(environmentIn_1.EnvironmentInSerializer._toJsonObject(environmentIn));
        return request.sendNoResponseBody(this.requestCtx);
    }
}
exports.Environment = Environment;
//# sourceMappingURL=environment.js.map