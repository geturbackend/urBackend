"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseMessageOutSerializer = void 0;
const messageOut_1 = require("./messageOut");
exports.ListResponseMessageOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => messageOut_1.MessageOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => messageOut_1.MessageOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseMessageOut.js.map