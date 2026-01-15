import { ConnectorKind } from "./connectorKind";
export interface ConnectorIn {
    description?: string;
    featureFlag?: string | null;
    featureFlags?: string[] | null;
    filterTypes?: string[] | null;
    instructions?: string;
    instructionsLink?: string | null;
    kind?: ConnectorKind;
    logo: string;
    name: string;
    transformation: string;
}
export declare const ConnectorInSerializer: {
    _fromJsonObject(object: any): ConnectorIn;
    _toJsonObject(self: ConnectorIn): any;
};
