"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointEnabledEventDataSerializer = void 0;
exports.EndpointEnabledEventDataSerializer = {
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
//# sourceMappingURL=endpointEnabledEventData.js.map