export interface IngestEndpointHeadersOut {
    headers: {
        [key: string]: string;
    };
    sensitive: string[];
}
export declare const IngestEndpointHeadersOutSerializer: {
    _fromJsonObject(object: any): IngestEndpointHeadersOut;
    _toJsonObject(self: IngestEndpointHeadersOut): any;
};
