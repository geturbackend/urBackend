import { EndpointCreatedEventData } from "./endpointCreatedEventData";
export interface EndpointCreatedEvent {
    data: EndpointCreatedEventData;
    type: string;
}
export declare const EndpointCreatedEventSerializer: {
    _fromJsonObject(object: any): EndpointCreatedEvent;
    _toJsonObject(self: EndpointCreatedEvent): any;
};
