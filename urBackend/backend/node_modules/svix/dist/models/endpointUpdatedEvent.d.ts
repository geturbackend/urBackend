import { EndpointUpdatedEventData } from "./endpointUpdatedEventData";
export interface EndpointUpdatedEvent {
    data: EndpointUpdatedEventData;
    type: string;
}
export declare const EndpointUpdatedEventSerializer: {
    _fromJsonObject(object: any): EndpointUpdatedEvent;
    _toJsonObject(self: EndpointUpdatedEvent): any;
};
