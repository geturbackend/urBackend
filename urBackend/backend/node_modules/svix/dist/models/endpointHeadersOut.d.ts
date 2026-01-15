export interface EndpointHeadersOut {
    headers: {
        [key: string]: string;
    };
    sensitive: string[];
}
export declare const EndpointHeadersOutSerializer: {
    _fromJsonObject(object: any): EndpointHeadersOut;
    _toJsonObject(self: EndpointHeadersOut): any;
};
