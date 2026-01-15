export interface EndpointDeletedEventData {
    appId: string;
    appUid?: string | null;
    endpointId: string;
    endpointUid?: string | null;
}
export declare const EndpointDeletedEventDataSerializer: {
    _fromJsonObject(object: any): EndpointDeletedEventData;
    _toJsonObject(self: EndpointDeletedEventData): any;
};
