"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestSourceConsumerPortalAccessInSerializer = void 0;
exports.IngestSourceConsumerPortalAccessInSerializer = {
    _fromJsonObject(object) {
        return {
            expiry: object["expiry"],
            readOnly: object["readOnly"],
        };
    },
    _toJsonObject(self) {
        return {
            expiry: self.expiry,
            readOnly: self.readOnly,
        };
    },
};
//# sourceMappingURL=ingestSourceConsumerPortalAccessIn.js.map