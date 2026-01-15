export interface EndpointUpdatedEventData {
    appId: string;
    appUid?: string | null;
    endpointId: string;
    endpointUid?: string | null;
}
export declare const EndpointUpdatedEventDataSerializer: {
    _fromJsonObject(object: any): EndpointUpdatedEventData;
    _toJsonObject(self: EndpointUpdatedEventData): any;
};
