export interface EndpointTransformationOut {
    code?: string | null;
    enabled?: boolean;
}
export declare const EndpointTransformationOutSerializer: {
    _fromJsonObject(object: any): EndpointTransformationOut;
    _toJsonObject(self: EndpointTransformationOut): any;
};
