export interface OperationalWebhookEndpointIn {
    description?: string;
    disabled?: boolean;
    filterTypes?: string[] | null;
    metadata?: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    secret?: string | null;
    uid?: string | null;
    url: string;
}
export declare const OperationalWebhookEndpointInSerializer: {
    _fromJsonObject(object: any): OperationalWebhookEndpointIn;
    _toJsonObject(self: OperationalWebhookEndpointIn): any;
};
