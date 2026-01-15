"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointEnabledEventSerializer = void 0;
const endpointEnabledEventData_1 = require("./endpointEnabledEventData");
exports.EndpointEnabledEventSerializer = {
    _fromJsonObject(object) {
        return {
            data: endpointEnabledEventData_1.EndpointEnabledEventDataSerializer._fromJsonObject(object["data"]),
            type: object["type"],
        };
    },
    _toJsonObject(self) {
        return {
            data: endpointEnabledEventData_1.EndpointEnabledEventDataSerializer._toJsonObject(self.data),
            type: self.type,
        };
    },
};
//# sourceMappingURL=endpointEnabledEvent.js.map