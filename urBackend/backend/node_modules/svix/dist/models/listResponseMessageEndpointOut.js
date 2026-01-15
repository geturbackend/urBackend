"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseMessageEndpointOutSerializer = void 0;
const messageEndpointOut_1 = require("./messageEndpointOut");
exports.ListResponseMessageEndpointOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseMessageEndpointOut.js.map