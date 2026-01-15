export interface AdobeSignConfig {
    clientId: string;
}
export declare const AdobeSignConfigSerializer: {
    _fromJsonObject(object: any): AdobeSignConfig;
    _toJsonObject(self: AdobeSignConfig): any;
};
