export interface EndpointEnabledEventData {
    appId: string;
    appUid?: string | null;
    endpointId: string;
    endpointUid?: string | null;
}
export declare const EndpointEnabledEventDataSerializer: {
    _fromJsonObject(object: any): EndpointEnabledEventData;
    _toJsonObject(self: EndpointEnabledEventData): any;
};
