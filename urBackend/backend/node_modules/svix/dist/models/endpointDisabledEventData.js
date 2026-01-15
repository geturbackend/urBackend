"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointDisabledEventDataSerializer = void 0;
const endpointDisabledTrigger_1 = require("./endpointDisabledTrigger");
exports.EndpointDisabledEventDataSerializer = {
    _fromJsonObject(object) {
        return {
            appId: object["appId"],
            appUid: object["appUid"],
            endpointId: object["endpointId"],
            endpointUid: object["endpointUid"],
            failSince: object["failSince"] ? new Date(object["failSince"]) : null,
            trigger: object["trigger"]
                ? endpointDisabledTrigger_1.EndpointDisabledTriggerSerializer._fromJsonObject(object["trigger"])
                : undefined,
        };
    },
    _toJsonObject(self) {
        return {
            appId: self.appId,
            appUid: self.appUid,
            endpointId: self.endpointId,
            endpointUid: self.endpointUid,
            failSince: self.failSince,
            trigger: self.trigger
                ? endpointDisabledTrigger_1.EndpointDisabledTriggerSerializer._toJsonObject(self.trigger)
                : undefined,
        };
    },
};
//# sourceMappingURL=endpointDisabledEventData.js.map