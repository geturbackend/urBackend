import { EndpointEnabledEventData } from "./endpointEnabledEventData";
export interface EndpointEnabledEvent {
    data: EndpointEnabledEventData;
    type: string;
}
export declare const EndpointEnabledEventSerializer: {
    _fromJsonObject(object: any): EndpointEnabledEvent;
    _toJsonObject(self: EndpointEnabledEvent): any;
};
