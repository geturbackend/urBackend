"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointCreatedEventSerializer = void 0;
const endpointCreatedEventData_1 = require("./endpointCreatedEventData");
exports.EndpointCreatedEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: endpointCreatedEventData_1.EndpointCreatedEventDataSerializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: endpointCreatedEventData_1.EndpointCreatedEventDataSerializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=endpointCreatedEvent.js.map