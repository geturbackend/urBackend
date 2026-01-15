"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentOutSerializer = void 0;
const connectorOut_1 = require("./connectorOut");
const eventTypeOut_1 = require("./eventTypeOut");
exports.EnvironmentOutSerializer = {
    _fromJsonObject(object) {
        return {
            createdAt: new Date(object["createdAt"]),
            eventTypes: object["eventTypes"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
            settings: object["settings"],
            transformationTemplates: object["transformationTemplates"].map((item) => connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
            version: object["version"],
        };
    },
    _toJsonObject(self) {
        return {
            createdAt: self.createdAt,
            eventTypes: self.eventTypes.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
            settings: self.settings,
            transformationTemplates: self.transformationTemplates.map((item) => connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
            version: self.version,
        };
    },
};
//# sourceMappingURL=environmentOut.js.map