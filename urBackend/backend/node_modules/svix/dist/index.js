"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Svix = exports.messageInRaw = exports.ValidationError = exports.HttpErrorOut = exports.HTTPValidationError = exports.ApiException = void 0;
const application_1 = require("./api/application");
const authentication_1 = require("./api/authentication");
const backgroundTask_1 = require("./api/backgroundTask");
const endpoint_1 = require("./api/endpoint");
const environment_1 = require("./api/environment");
const eventType_1 = require("./api/eventType");
const health_1 = require("./api/health");
const ingest_1 = require("./api/ingest");
const integration_1 = require("./api/integration");
const message_1 = require("./api/message");
const messageAttempt_1 = require("./api/messageAttempt");
const operationalWebhook_1 = require("./api/operationalWebhook");
const statistics_1 = require("./api/statistics");
const operationalWebhookEndpoint_1 = require("./api/operationalWebhookEndpoint");
var util_1 = require("./util");
Object.defineProperty(exports, "ApiException", { enumerable: true, get: function () { return util_1.ApiException; } });
var HttpErrors_1 = require("./HttpErrors");
Object.defineProperty(exports, "HTTPValidationError", { enumerable: true, get: function () { return HttpErrors_1.HTTPValidationError; } });
Object.defineProperty(exports, "HttpErrorOut", { enumerable: true, get: function () { return HttpErrors_1.HttpErrorOut; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return HttpErrors_1.ValidationError; } });
__exportStar(require("./webhook"), exports);
__exportStar(require("./models/index"), exports);
var message_2 = require("./api/message");
Object.defineProperty(exports, "messageInRaw", { enumerable: true, get: function () { return message_2.messageInRaw; } });
const REGIONS = [
    { region: "us", url: "https://api.us.svix.com" },
    { region: "eu", url: "https://api.eu.svix.com" },
    { region: "in", url: "https://api.in.svix.com" },
    { region: "ca", url: "https://api.ca.svix.com" },
    { region: "au", url: "https://api.au.svix.com" },
];
class Svix {
    constructor(token, options = {}) {
        var _a, _b, _c;
        const regionalUrl = (_a = REGIONS.find((x) => x.region === token.split(".")[1])) === null || _a === void 0 ? void 0 : _a.url;
        const baseUrl = (_c = (_b = options.serverUrl) !== null && _b !== void 0 ? _b : regionalUrl) !== null && _c !== void 0 ? _c : "https://api.svix.com";
        if (options.retryScheduleInMs) {
            this.requestCtx = {
                baseUrl,
                token,
                timeout: options.requestTimeout,
                retryScheduleInMs: options.retryScheduleInMs,
            };
            return;
        }
        if (options.numRetries) {
            this.requestCtx = {
                baseUrl,
                token,
                timeout: options.requestTimeout,
                numRetries: options.numRetries,
            };
            return;
        }
        this.requestCtx = {
            baseUrl,
            token,
            timeout: options.requestTimeout,
        };
    }
    get application() {
        return new application_1.Application(this.requestCtx);
    }
    get authentication() {
        return new authentication_1.Authentication(this.requestCtx);
    }
    get backgroundTask() {
        return new backgroundTask_1.BackgroundTask(this.requestCtx);
    }
    get endpoint() {
        return new endpoint_1.Endpoint(this.requestCtx);
    }
    get environment() {
        return new environment_1.Environment(this.requestCtx);
    }
    get eventType() {
        return new eventType_1.EventType(this.requestCtx);
    }
    get health() {
        return new health_1.Health(this.requestCtx);
    }
    get ingest() {
        return new ingest_1.Ingest(this.requestCtx);
    }
    get integration() {
        return new integration_1.Integration(this.requestCtx);
    }
    get message() {
        return new message_1.Message(this.requestCtx);
    }
    get messageAttempt() {
        return new messageAttempt_1.MessageAttempt(this.requestCtx);
    }
    get operationalWebhook() {
        return new operationalWebhook_1.OperationalWebhook(this.requestCtx);
    }
    get statistics() {
        return new statistics_1.Statistics(this.requestCtx);
    }
    get operationalWebhookEndpoint() {
        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
    }
}
exports.Svix = Svix;
//# sourceMappingURL=index.js.map