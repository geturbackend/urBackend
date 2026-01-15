export interface OperationalWebhookEndpointOut {
    createdAt: Date;
    description: string;
    disabled?: boolean;
    filterTypes?: string[] | null;
    id: string;
    metadata: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    uid?: string | null;
    updatedAt: Date;
    url: string;
}
export declare const OperationalWebhookEndpointOutSerializer: {
    _fromJsonObject(object: any): OperationalWebhookEndpointOut;
    _toJsonObject(self: OperationalWebhookEndpointOut): any;
};
