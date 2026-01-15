export interface TelnyxConfig {
    publicKey: string;
}
export declare const TelnyxConfigSerializer: {
    _fromJsonObject(object: any): TelnyxConfig;
    _toJsonObject(self: TelnyxConfig): any;
};
