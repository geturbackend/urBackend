"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorInSerializer = void 0;
const connectorKind_1 = require("./connectorKind");
exports.ConnectorInSerializer = {
    _fromJsonObject(object) {
        return {
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            filterTypes: object["filterTypes"],
            instructions: object["instructions"],
            instructionsLink: object["instructionsLink"],
            kind: object["kind"]
                ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"])
                : undefined,
            logo: object["logo"],
            name: object["name"],
            transformation: object["transformation"],
        };
    },
    _toJsonObject(self) {
        return {
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            filterTypes: self.filterTypes,
            instructions: self.instructions,
            instructionsLink: self.instructionsLink,
            kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : undefined,
            logo: self.logo,
            name: self.name,
            transformation: self.transformation,
        };
    },
};
//# sourceMappingURL=connectorIn.js.map