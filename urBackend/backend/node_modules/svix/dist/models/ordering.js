"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderingSerializer = exports.Ordering = void 0;
var Ordering;
(function (Ordering) {
    Ordering["Ascending"] = "ascending";
    Ordering["Descending"] = "descending";
})(Ordering = exports.Ordering || (exports.Ordering = {}));
exports.OrderingSerializer = {
    _fromJsonObject(object) {
        return object;
    },
    _toJsonObject(self) {
        return self;
    },
};
//# sourceMappingURL=ordering.js.map