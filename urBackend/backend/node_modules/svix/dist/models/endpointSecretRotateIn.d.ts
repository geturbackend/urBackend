export interface EndpointSecretRotateIn {
    key?: string | null;
}
export declare const EndpointSecretRotateInSerializer: {
    _fromJsonObject(object: any): EndpointSecretRotateIn;
    _toJsonObject(self: EndpointSecretRotateIn): any;
};
