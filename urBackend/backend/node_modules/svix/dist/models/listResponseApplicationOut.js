"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseApplicationOutSerializer = void 0;
const applicationOut_1 = require("./applicationOut");
exports.ListResponseApplicationOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => applicationOut_1.ApplicationOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => applicationOut_1.ApplicationOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseApplicationOut.js.map