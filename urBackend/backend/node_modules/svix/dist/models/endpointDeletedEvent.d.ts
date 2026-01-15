import { EndpointDeletedEventData } from "./endpointDeletedEventData";
export interface EndpointDeletedEvent {
    data: EndpointDeletedEventData;
    type: string;
}
export declare const EndpointDeletedEventSerializer: {
    _fromJsonObject(object: any): EndpointDeletedEvent;
    _toJsonObject(self: EndpointDeletedEvent): any;
};
