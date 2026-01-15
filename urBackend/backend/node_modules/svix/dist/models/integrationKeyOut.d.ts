export interface IntegrationKeyOut {
    key: string;
}
export declare const IntegrationKeyOutSerializer: {
    _fromJsonObject(object: any): IntegrationKeyOut;
    _toJsonObject(self: IntegrationKeyOut): any;
};
