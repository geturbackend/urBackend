"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointUpdatedEventSerializer = void 0;
const endpointUpdatedEventData_1 = require("./endpointUpdatedEventData");
exports.EndpointUpdatedEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: endpointUpdatedEventData_1.EndpointUpdatedEventDataSerializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: endpointUpdatedEventData_1.EndpointUpdatedEventDataSerializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=endpointUpdatedEvent.js.map