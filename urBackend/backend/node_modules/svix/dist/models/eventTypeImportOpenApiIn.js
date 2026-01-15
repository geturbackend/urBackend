"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeImportOpenApiInSerializer = void 0;
exports.EventTypeImportOpenApiInSerializer = {
    _fromJsonObject(object) {
        return {
            dryRun: object["dryRun"],
            replaceAll: object["replaceAll"],
            spec: object["spec"],
            specRaw: object["specRaw"],
        };
    },
    _toJsonObject(self) {
        return {
            dryRun: self.dryRun,
            replaceAll: self.replaceAll,
            spec: self.spec,
            specRaw: self.specRaw,
        };
    },
};
//# sourceMappingURL=eventTypeImportOpenApiIn.js.map