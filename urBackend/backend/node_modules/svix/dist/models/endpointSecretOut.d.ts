export interface EndpointSecretOut {
    key: string;
}
export declare const EndpointSecretOutSerializer: {
    _fromJsonObject(object: any): EndpointSecretOut;
    _toJsonObject(self: EndpointSecretOut): any;
};
