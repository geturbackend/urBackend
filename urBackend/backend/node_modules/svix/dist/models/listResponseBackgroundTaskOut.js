"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseBackgroundTaskOutSerializer = void 0;
const backgroundTaskOut_1 = require("./backgroundTaskOut");
exports.ListResponseBackgroundTaskOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseBackgroundTaskOut.js.map