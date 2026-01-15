"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvixRequest = exports.HttpMethod = exports.LIB_VERSION = void 0;
const util_1 = require("./util");
const uuid_1 = require("uuid");
exports.LIB_VERSION = "1.76.1";
const USER_AGENT = `svix-libs/${exports.LIB_VERSION}/javascript`;
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["HEAD"] = "HEAD";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["CONNECT"] = "CONNECT";
    HttpMethod["OPTIONS"] = "OPTIONS";
    HttpMethod["TRACE"] = "TRACE";
    HttpMethod["PATCH"] = "PATCH";
})(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
class SvixRequest {
    constructor(method, path) {
        this.method = method;
        this.path = path;
        this.queryParams = {};
        this.headerParams = {};
    }
    setPathParam(name, value) {
        const newPath = this.path.replace(`{${name}}`, encodeURIComponent(value));
        if (this.path === newPath) {
            throw new Error(`path parameter ${name} not found`);
        }
        this.path = newPath;
    }
    setQueryParam(name, value) {
        if (value === undefined || value === null) {
            return;
        }
        if (typeof value === "string") {
            this.queryParams[name] = value;
        }
        else if (typeof value === "boolean" || typeof value === "number") {
            this.queryParams[name] = value.toString();
        }
        else if (value instanceof Date) {
            this.queryParams[name] = value.toISOString();
        }
        else if (value instanceof Array) {
            if (value.length > 0) {
                this.queryParams[name] = value.join(",");
            }
        }
        else {
            const _assert_unreachable = value;
            throw new Error(`query parameter ${name} has unsupported type`);
        }
    }
    setHeaderParam(name, value) {
        if (value === undefined) {
            return;
        }
        this.headerParams[name] = value;
    }
    setBody(value) {
        this.body = JSON.stringify(value);
    }
    send(ctx, parseResponseBody) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.sendInner(ctx);
            if (response.status == 204) {
                return null;
            }
            const responseBody = yield response.text();
            return parseResponseBody(JSON.parse(responseBody));
        });
    }
    sendNoResponseBody(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendInner(ctx);
        });
    }
    sendInner(ctx) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const url = new URL(ctx.baseUrl + this.path);
            for (const [name, value] of Object.entries(this.queryParams)) {
                url.searchParams.set(name, value);
            }
            if (this.headerParams["idempotency-key"] === undefined &&
                this.method.toUpperCase() === "POST") {
                this.headerParams["idempotency-key"] = "auto_" + (0, uuid_1.v4)();
            }
            const randomId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            if (this.body != null) {
                this.headerParams["content-type"] = "application/json";
            }
            const isCredentialsSupported = "credentials" in Request.prototype;
            const response = yield sendWithRetry(url, {
                method: this.method.toString(),
                body: this.body,
                headers: Object.assign({ accept: "application/json, */*;q=0.8", authorization: `Bearer ${ctx.token}`, "user-agent": USER_AGENT, "svix-req-id": randomId.toString() }, this.headerParams),
                credentials: isCredentialsSupported ? "same-origin" : undefined,
                signal: ctx.timeout !== undefined ? AbortSignal.timeout(ctx.timeout) : undefined,
            }, ctx.retryScheduleInMs, (_a = ctx.retryScheduleInMs) === null || _a === void 0 ? void 0 : _a[0], ((_b = ctx.retryScheduleInMs) === null || _b === void 0 ? void 0 : _b.length) || ctx.numRetries);
            return filterResponseForErrors(response);
        });
    }
}
exports.SvixRequest = SvixRequest;
function filterResponseForErrors(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.status < 300) {
            return response;
        }
        const responseBody = yield response.text();
        if (response.status === 422) {
            throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
        }
        if (response.status >= 400 && response.status <= 499) {
            throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
        }
        throw new util_1.ApiException(response.status, responseBody, response.headers);
    });
}
function sendWithRetry(url, init, retryScheduleInMs, nextInterval = 50, triesLeft = 2, retryCount = 1) {
    return __awaiter(this, void 0, void 0, function* () {
        const sleep = (interval) => new Promise((resolve) => setTimeout(resolve, interval));
        try {
            const response = yield fetch(url, init);
            if (triesLeft <= 0 || response.status < 500) {
                return response;
            }
        }
        catch (e) {
            if (triesLeft <= 0) {
                throw e;
            }
        }
        yield sleep(nextInterval);
        init.headers["svix-retry-count"] = retryCount.toString();
        nextInterval = (retryScheduleInMs === null || retryScheduleInMs === void 0 ? void 0 : retryScheduleInMs[retryCount]) || nextInterval * 2;
        return yield sendWithRetry(url, init, retryScheduleInMs, nextInterval, --triesLeft, ++retryCount);
    });
}
//# sourceMappingURL=request.js.map