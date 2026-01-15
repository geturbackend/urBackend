"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeImportOpenApiOutSerializer = void 0;
const eventTypeImportOpenApiOutData_1 = require("./eventTypeImportOpenApiOutData");
exports.EventTypeImportOpenApiOutSerializer = {
    _fromJsonObject(object) {
        return {
            data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._fromJsonObject(object["data"]),
        };
    },
    _toJsonObject(self) {
        return {
            data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._toJsonObject(self.data),
        };
    },
};
//# sourceMappingURL=eventTypeImportOpenApiOut.js.map