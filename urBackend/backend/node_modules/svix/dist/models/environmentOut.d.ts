import { ConnectorOut } from "./connectorOut";
import { EventTypeOut } from "./eventTypeOut";
export interface EnvironmentOut {
    createdAt: Date;
    eventTypes: EventTypeOut[];
    settings: any | null;
    transformationTemplates: ConnectorOut[];
    version?: number;
}
export declare const EnvironmentOutSerializer: {
    _fromJsonObject(object: any): EnvironmentOut;
    _toJsonObject(self: EnvironmentOut): any;
};
