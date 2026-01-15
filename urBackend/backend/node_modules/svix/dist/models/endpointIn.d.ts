export interface EndpointIn {
    channels?: string[] | null;
    description?: string;
    disabled?: boolean;
    filterTypes?: string[] | null;
    headers?: {
        [key: string]: string;
    } | null;
    metadata?: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    secret?: string | null;
    uid?: string | null;
    url: string;
    version?: number | null;
}
export declare const EndpointInSerializer: {
    _fromJsonObject(object: any): EndpointIn;
    _toJsonObject(self: EndpointIn): any;
};
