"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeImportOpenApiOutDataSerializer = void 0;
const eventTypeFromOpenApi_1 = require("./eventTypeFromOpenApi");
exports.EventTypeImportOpenApiOutDataSerializer = {
    _fromJsonObject(object) {
        var _a;
        return {
            modified: object["modified"],
            toModify: (_a = object["to_modify"]) === null || _a === void 0 ? void 0 : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._fromJsonObject(item)),
        };
    },
    _toJsonObject(self) {
        var _a;
        return {
            modified: self.modified,
            to_modify: (_a = self.toModify) === null || _a === void 0 ? void 0 : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._toJsonObject(item)),
        };
    },
};
//# sourceMappingURL=eventTypeImportOpenApiOutData.js.map