export interface IngestEndpointUpdate {
    description?: string;
    disabled?: boolean;
    metadata?: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    uid?: string | null;
    url: string;
}
export declare const IngestEndpointUpdateSerializer: {
    _fromJsonObject(object: any): IngestEndpointUpdate;
    _toJsonObject(self: IngestEndpointUpdate): any;
};
