export declare enum StatusCodeClass {
    CodeNone = 0,
    Code1xx = 100,
    Code2xx = 200,
    Code3xx = 300,
    Code4xx = 400,
    Code5xx = 500
}
export declare const StatusCodeClassSerializer: {
    _fromJsonObject(object: any): StatusCodeClass;
    _toJsonObject(self: StatusCodeClass): any;
};
