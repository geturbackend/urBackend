"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalWebhook = void 0;
const operationalWebhookEndpoint_1 = require("./operationalWebhookEndpoint");
class OperationalWebhook {
    constructor(requestCtx) {
        this.requestCtx = requestCtx;
    }
    get endpoint() {
        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
    }
}
exports.OperationalWebhook = OperationalWebhook;
//# sourceMappingURL=operationalWebhook.js.map