export interface VapiConfig {
    secret: string;
}
export declare const VapiConfigSerializer: {
    _fromJsonObject(object: any): VapiConfig;
    _toJsonObject(self: VapiConfig): any;
};
