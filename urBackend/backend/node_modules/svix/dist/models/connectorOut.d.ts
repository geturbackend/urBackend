import { ConnectorKind } from "./connectorKind";
export interface ConnectorOut {
    createdAt: Date;
    description: string;
    featureFlag?: string | null;
    featureFlags?: string[] | null;
    filterTypes?: string[] | null;
    id: string;
    instructions: string;
    instructionsLink?: string | null;
    kind: ConnectorKind;
    logo: string;
    name: string;
    orgId: string;
    transformation: string;
    updatedAt: Date;
}
export declare const ConnectorOutSerializer: {
    _fromJsonObject(object: any): ConnectorOut;
    _toJsonObject(self: ConnectorOut): any;
};
