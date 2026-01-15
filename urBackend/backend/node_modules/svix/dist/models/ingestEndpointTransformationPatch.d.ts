export interface IngestEndpointTransformationPatch {
    code?: string | null;
    enabled?: boolean;
}
export declare const IngestEndpointTransformationPatchSerializer: {
    _fromJsonObject(object: any): IngestEndpointTransformationPatch;
    _toJsonObject(self: IngestEndpointTransformationPatch): any;
};
