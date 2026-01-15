"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollingEndpointMessageOutSerializer = void 0;
exports.PollingEndpointMessageOutSerializer = {
    _fromJsonObject(object) {
        return {
            channels: object["channels"],
            eventId: object["eventId"],
            eventType: object["eventType"],
            headers: object["headers"],
            id: object["id"],
            payload: object["payload"],
            tags: object["tags"],
            timestamp: new Date(object["timestamp"]),
        };
    },
    _toJsonObject(self) {
        return {
            channels: self.channels,
            eventId: self.eventId,
            eventType: self.eventType,
            headers: self.headers,
            id: self.id,
            payload: self.payload,
            tags: self.tags,
            timestamp: self.timestamp,
        };
    },
};
//# sourceMappingURL=pollingEndpointMessageOut.js.map