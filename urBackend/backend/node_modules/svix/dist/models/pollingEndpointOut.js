"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingEndpointOutSerializer = void 0;
const pollingEndpointMessageOut_1 = require("./pollingEndpointMessageOut");
exports.PollingEndpointOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
        };
    },
};
//# sourceMappingURL=pollingEndpointOut.js.map