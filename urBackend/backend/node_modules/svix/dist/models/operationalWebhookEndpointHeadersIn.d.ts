export interface OperationalWebhookEndpointHeadersIn {
    headers: {
        [key: string]: string;
    };
}
export declare const OperationalWebhookEndpointHeadersInSerializer: {
    _fromJsonObject(object: any): OperationalWebhookEndpointHeadersIn;
    _toJsonObject(self: OperationalWebhookEndpointHeadersIn): any;
};
