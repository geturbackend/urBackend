"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventExampleInSerializer = void 0;
exports.EventExampleInSerializer = {
    _fromJsonObject(object) {
        return {
            eventType: object["eventType"],
            exampleIndex: object["exampleIndex"],
        };
    },
    _toJsonObject(self) {
        return {
            eventType: self.eventType,
            exampleIndex: self.exampleIndex,
        };
    },
};
//# sourceMappingURL=eventExampleIn.js.map