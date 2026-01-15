"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Statistics = void 0;
const aggregateEventTypesOut_1 = require("../models/aggregateEventTypesOut");
const appUsageStatsIn_1 = require("../models/appUsageStatsIn");
const appUsageStatsOut_1 = require("../models/appUsageStatsOut");
const request_1 = require("../request");
class Statistics {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    aggregateAppStats(appUsageStatsIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stats/usage/app");
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(appUsageStatsIn_1.AppUsageStatsInSerializer._toJsonObject(appUsageStatsIn));
        return request.send(this.requestCtx, appUsageStatsOut_1.AppUsageStatsOutSerializer._fromJsonObject);
    }
    aggregateEventTypes() {
        const request = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stats/usage/event-types");
        return request.send(this.requestCtx, aggregateEventTypesOut_1.AggregateEventTypesOutSerializer._fromJsonObject);
    }
}
exports.Statistics = Statistics;
//# sourceMappingURL=statistics.js.map