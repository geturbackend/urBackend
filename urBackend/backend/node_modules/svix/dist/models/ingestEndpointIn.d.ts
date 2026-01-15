export interface IngestEndpointIn {
    description?: string;
    disabled?: boolean;
    metadata?: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    secret?: string | null;
    uid?: string | null;
    url: string;
}
export declare const IngestEndpointInSerializer: {
    _fromJsonObject(object: any): IngestEndpointIn;
    _toJsonObject(self: IngestEndpointIn): any;
};
