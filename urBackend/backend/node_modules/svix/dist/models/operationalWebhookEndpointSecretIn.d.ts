export interface OperationalWebhookEndpointSecretIn {
    key?: string | null;
}
export declare const OperationalWebhookEndpointSecretInSerializer: {
    _fromJsonObject(object: any): OperationalWebhookEndpointSecretIn;
    _toJsonObject(self: OperationalWebhookEndpointSecretIn): any;
};
