"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointDisabledEventSerializer = void 0;
const endpointDisabledEventData_1 = require("./endpointDisabledEventData");
exports.EndpointDisabledEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: endpointDisabledEventData_1.EndpointDisabledEventDataSerializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: endpointDisabledEventData_1.EndpointDisabledEventDataSerializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=endpointDisabledEvent.js.map