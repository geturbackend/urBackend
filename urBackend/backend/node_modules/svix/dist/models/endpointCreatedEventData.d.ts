export interface EndpointCreatedEventData {
    appId: string;
    appUid?: string | null;
    endpointId: string;
    endpointUid?: string | null;
}
export declare const EndpointCreatedEventDataSerializer: {
    _fromJsonObject(object: any): EndpointCreatedEventData;
    _toJsonObject(self: EndpointCreatedEventData): any;
};
