"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseOperationalWebhookEndpointOutSerializer = void 0;
const operationalWebhookEndpointOut_1 = require("./operationalWebhookEndpointOut");
exports.ListResponseOperationalWebhookEndpointOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseOperationalWebhookEndpointOut.js.map