export interface IngestEndpointHeadersIn {
    headers: {
        [key: string]: string;
    };
}
export declare const IngestEndpointHeadersInSerializer: {
    _fromJsonObject(object: any): IngestEndpointHeadersIn;
    _toJsonObject(self: IngestEndpointHeadersIn): any;
};
