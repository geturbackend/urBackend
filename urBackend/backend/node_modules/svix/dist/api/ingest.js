"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ingest = void 0;
const dashboardAccessOut_1 = require("../models/dashboardAccessOut");
const ingestSourceConsumerPortalAccessIn_1 = require("../models/ingestSourceConsumerPortalAccessIn");
const ingestEndpoint_1 = require("./ingestEndpoint");
const ingestSource_1 = require("./ingestSource");
const request_1 = require("../request");
class Ingest {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    get endpoint() {
        return new ingestEndpoint_1.IngestEndpoint(this.requestCtx);
    }
    get source() {
        return new ingestSource_1.IngestSource(this.requestCtx);
    }
    dashboard(sourceId, ingestSourceConsumerPortalAccessIn, options) {
        const request = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/dashboard");
        request.setPathParam("source_id", sourceId);
        request.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
        request.setBody(ingestSourceConsumerPortalAccessIn_1.IngestSourceConsumerPortalAccessInSerializer._toJsonObject(ingestSourceConsumerPortalAccessIn));
        return request.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
    }
}
exports.Ingest = Ingest;
//# sourceMappingURL=ingest.js.map