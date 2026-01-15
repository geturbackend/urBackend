export interface EndpointTransformationIn {
    code?: string | null;
    enabled?: boolean;
}
export declare const EndpointTransformationInSerializer: {
    _fromJsonObject(object: any): EndpointTransformationIn;
    _toJsonObject(self: EndpointTransformationIn): any;
};
