import { EndpointDisabledEventData } from "./endpointDisabledEventData";
export interface EndpointDisabledEvent {
    data: EndpointDisabledEventData;
    type: string;
}
export declare const EndpointDisabledEventSerializer: {
    _fromJsonObject(object: any): EndpointDisabledEvent;
    _toJsonObject(self: EndpointDisabledEvent): any;
};
