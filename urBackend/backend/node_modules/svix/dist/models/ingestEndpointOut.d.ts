export interface IngestEndpointOut {
    createdAt: Date;
    description: string;
    disabled?: boolean;
    id: string;
    metadata: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    uid?: string | null;
    updatedAt: Date;
    url: string;
}
export declare const IngestEndpointOutSerializer: {
    _fromJsonObject(object: any): IngestEndpointOut;
    _toJsonObject(self: IngestEndpointOut): any;
};
