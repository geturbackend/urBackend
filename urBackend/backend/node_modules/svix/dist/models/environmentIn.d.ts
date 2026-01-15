import { ConnectorIn } from "./connectorIn";
import { EventTypeIn } from "./eventTypeIn";
export interface EnvironmentIn {
    connectors?: ConnectorIn[] | null;
    eventTypes?: EventTypeIn[] | null;
    settings?: any | null;
}
export declare const EnvironmentInSerializer: {
    _fromJsonObject(object: any): EnvironmentIn;
    _toJsonObject(self: EnvironmentIn): any;
};
