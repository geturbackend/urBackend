"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListResponseIntegrationOutSerializer = void 0;
const integrationOut_1 = require("./integrationOut");
exports.ListResponseIntegrationOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: object["data"].map((item) => integrationOut_1.IntegrationOutSerializer._fromJsonObject(item)),
            done: object["done"],
            iterator: object["iterator"],
            prevIterator: object["prevIterator"],
        };
    },
    _toJsonObject(self) {
        return {
            data: self.data.map((item) => integrationOut_1.IntegrationOutSerializer._toJsonObject(item)),
            done: self.done,
            iterator: self.iterator,
            prevIterator: self.prevIterator,
        };
    },
};
//# sourceMappingURL=listResponseIntegrationOut.js.map