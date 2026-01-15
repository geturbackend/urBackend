export interface IngestEndpointSecretIn {
    key?: string | null;
}
export declare const IngestEndpointSecretInSerializer: {
    _fromJsonObject(object: any): IngestEndpointSecretIn;
    _toJsonObject(self: IngestEndpointSecretIn): any;
};
