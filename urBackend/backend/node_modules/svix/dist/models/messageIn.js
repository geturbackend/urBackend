"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageInSerializer = void 0;
const applicationIn_1 = require("./applicationIn");
exports.MessageInSerializer = {
    _fromJsonObject(object) {
        return {
            application: object["application"]
                ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"])
                : undefined,
            channels: object["channels"],
            eventId: object["eventId"],
            eventType: object["eventType"],
            payload: object["payload"],
            payloadRetentionHours: object["payloadRetentionHours"],
            payloadRetentionPeriod: object["payloadRetentionPeriod"],
            tags: object["tags"],
            transformationsParams: object["transformationsParams"],
        };
    },
    _toJsonObject(self) {
        return {
            application: self.application
                ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application)
                : undefined,
            channels: self.channels,
            eventId: self.eventId,
            eventType: self.eventType,
            payload: self.payload,
            payloadRetentionHours: self.payloadRetentionHours,
            payloadRetentionPeriod: self.payloadRetentionPeriod,
            tags: self.tags,
            transformationsParams: self.transformationsParams,
        };
    },
};
//# sourceMappingURL=messageIn.js.map