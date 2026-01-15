"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageEndpointOutSerializer = void 0;
const messageStatus_1 = require("./messageStatus");
const messageStatusText_1 = require("./messageStatusText");
exports.MessageEndpointOutSerializer = {
    _fromJsonObject(object) {
        return {
            channels: object["channels"],
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            disabled: object["disabled"],
            filterTypes: object["filterTypes"],
            id: object["id"],
            nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
            rateLimit: object["rateLimit"],
            status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
            statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
            uid: object["uid"],
            updatedAt: new Date(object["updatedAt"]),
            url: object["url"],
            version: object["version"],
        };
    },
    _toJsonObject(self) {
        return {
            channels: self.channels,
            createdAt: self.createdAt,
            description: self.description,
            disabled: self.disabled,
            filterTypes: self.filterTypes,
            id: self.id,
            nextAttempt: self.nextAttempt,
            rateLimit: self.rateLimit,
            status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
            statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
            uid: self.uid,
            updatedAt: self.updatedAt,
            url: self.url,
            version: self.version,
        };
    },
};
//# sourceMappingURL=messageEndpointOut.js.map