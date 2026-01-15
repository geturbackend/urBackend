"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseIngestEndpointOutSerializer = void 0;
const ingestEndpointOut_1 = require("./ingestEndpointOut");
exports.ListResponseIngestEndpointOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseIngestEndpointOut.js.map