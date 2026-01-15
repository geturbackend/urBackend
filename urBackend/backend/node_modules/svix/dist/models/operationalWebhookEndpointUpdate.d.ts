export interface OperationalWebhookEndpointUpdate {
    description?: string;
    disabled?: boolean;
    filterTypes?: string[] | null;
    metadata?: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    uid?: string | null;
    url: string;
}
export declare const OperationalWebhookEndpointUpdateSerializer: {
    _fromJsonObject(object: any): OperationalWebhookEndpointUpdate;
    _toJsonObject(self: OperationalWebhookEndpointUpdate): any;
};
