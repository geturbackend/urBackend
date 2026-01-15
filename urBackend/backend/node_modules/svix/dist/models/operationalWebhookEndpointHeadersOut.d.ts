export interface OperationalWebhookEndpointHeadersOut {
    headers: {
        [key: string]: string;
    };
    sensitive: string[];
}
export declare const OperationalWebhookEndpointHeadersOutSerializer: {
    _fromJsonObject(object: any): OperationalWebhookEndpointHeadersOut;
    _toJsonObject(self: OperationalWebhookEndpointHeadersOut): any;
};
