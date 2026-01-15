"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointDeletedEventSerializer = void 0;
const endpointDeletedEventData_1 = require("./endpointDeletedEventData");
exports.EndpointDeletedEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: endpointDeletedEventData_1.EndpointDeletedEventDataSerializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: endpointDeletedEventData_1.EndpointDeletedEventDataSerializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=endpointDeletedEvent.js.map