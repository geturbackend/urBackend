"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentInSerializer = void 0;
const connectorIn_1 = require("./connectorIn");
const eventTypeIn_1 = require("./eventTypeIn");
exports.EnvironmentInSerializer = {
    _fromJsonObject(object) {
        var _a, _b;
        return {
            connectors: (_a = object["connectors"]) === null || _a === void 0 ? void 0 : _a.map((item) => connectorIn_1.ConnectorInSerializer._fromJsonObject(item)),
            eventTypes: (_b = object["eventTypes"]) === null || _b === void 0 ? void 0 : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._fromJsonObject(item)),
            settings: object["settings"],
        };
    },
    _toJsonObject(self) {
        var _a, _b;
        return {
            connectors: (_a = self.connectors) === null || _a === void 0 ? void 0 : _a.map((item) => connectorIn_1.ConnectorInSerializer._toJsonObject(item)),
            eventTypes: (_b = self.eventTypes) === null || _b === void 0 ? void 0 : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._toJsonObject(item)),
            settings: self.settings,
        };
    },
};
//# sourceMappingURL=environmentIn.js.map