"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseIngestSourceOutSerializer = void 0;
const ingestSourceOut_1 = require("./ingestSourceOut");
exports.ListResponseIngestSourceOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => ingestSourceOut_1.IngestSourceOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseIngestSourceOut.js.map