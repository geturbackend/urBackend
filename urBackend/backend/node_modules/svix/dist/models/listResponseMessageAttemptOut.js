"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseMessageAttemptOutSerializer = void 0;
const messageAttemptOut_1 = require("./messageAttemptOut");
exports.ListResponseMessageAttemptOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseMessageAttemptOut.js.map