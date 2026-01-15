"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseEventTypeOutSerializer = void 0;
const eventTypeOut_1 = require("./eventTypeOut");
exports.ListResponseEventTypeOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseEventTypeOut.js.map