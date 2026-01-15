"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorOutSerializer = void 0;
const connectorKind_1 = require("./connectorKind");
exports.ConnectorOutSerializer = {
    _fromJsonObject(object) {
        return {
            createdAt: new Date(object["createdAt"]),
            description: object["description"],
            featureFlag: object["featureFlag"],
            featureFlags: object["featureFlags"],
            filterTypes: object["filterTypes"],
            id: object["id"],
            instructions: object["instructions"],
            instructionsLink: object["instructionsLink"],
            kind: connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]),
            logo: object["logo"],
            name: object["name"],
            orgId: object["orgId"],
            transformation: object["transformation"],
            updatedAt: new Date(object["updatedAt"]),
        };
    },
    _toJsonObject(self) {
        return {
            createdAt: self.createdAt,
            description: self.description,
            featureFlag: self.featureFlag,
            featureFlags: self.featureFlags,
            filterTypes: self.filterTypes,
            id: self.id,
            instructions: self.instructions,
            instructionsLink: self.instructionsLink,
            kind: connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind),
            logo: self.logo,
            name: self.name,
            orgId: self.orgId,
            transformation: self.transformation,
            updatedAt: self.updatedAt,
        };
    },
};
//# sourceMappingURL=connectorOut.js.map