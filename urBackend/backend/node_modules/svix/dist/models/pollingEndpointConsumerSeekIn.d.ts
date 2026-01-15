export interface PollingEndpointConsumerSeekIn {
    after: Date;
}
export declare const PollingEndpointConsumerSeekInSerializer: {
    _fromJsonObject(object: any): PollingEndpointConsumerSeekIn;
    _toJsonObject(self: PollingEndpointConsumerSeekIn): any;
};
