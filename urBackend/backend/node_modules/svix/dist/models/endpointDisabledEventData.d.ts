import { EndpointDisabledTrigger } from "./endpointDisabledTrigger";
export interface EndpointDisabledEventData {
    appId: string;
    appUid?: string | null;
    endpointId: string;
    endpointUid?: string | null;
    failSince?: Date | null;
    trigger?: EndpointDisabledTrigger;
}
export declare const EndpointDisabledEventDataSerializer: {
    _fromJsonObject(object: any): EndpointDisabledEventData;
    _toJsonObject(self: EndpointDisabledEventData): any;
};
