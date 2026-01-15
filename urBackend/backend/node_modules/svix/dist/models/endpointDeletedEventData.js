"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointDeletedEventDataSerializer = void 0;
exports.EndpointDeletedEventDataSerializer = {
    _fromJsonObject(object) {
        return {
            appId: object["appId"],
            appUid: object["appUid"],
            endpointId: object["endpointId"],
            endpointUid: object["endpointUid"],
        };
    },
    _toJsonObject(self) {
        return {
            appId: self.appId,
            appUid: self.appUid,
            endpointId: self.endpointId,
            endpointUid: self.endpointUid,
        };
    },
};
//# sourceMappingURL=endpointDeletedEventData.js.map