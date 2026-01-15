export interface EndpointHeadersIn {
    headers: {
        [key: string]: string;
    };
}
export declare const EndpointHeadersInSerializer: {
    _fromJsonObject(object: any): EndpointHeadersIn;
    _toJsonObject(self: EndpointHeadersIn): any;
};
