export interface EndpointTransformationPatch {
    code?: string | null;
    enabled?: boolean;
}
export declare const EndpointTransformationPatchSerializer: {
    _fromJsonObject(object: any): EndpointTransformationPatch;
    _toJsonObject(self: EndpointTransformationPatch): any;
};
