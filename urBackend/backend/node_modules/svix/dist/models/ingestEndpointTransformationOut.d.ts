export interface IngestEndpointTransformationOut {
    code?: string | null;
    enabled?: boolean;
}
export declare const IngestEndpointTransformationOutSerializer: {
    _fromJsonObject(object: any): IngestEndpointTransformationOut;
    _toJsonObject(self: IngestEndpointTransformationOut): any;
};
