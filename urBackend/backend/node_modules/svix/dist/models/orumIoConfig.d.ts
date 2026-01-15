export interface OrumIoConfig {
    publicKey: string;
}
export declare const OrumIoConfigSerializer: {
    _fromJsonObject(object: any): OrumIoConfig;
    _toJsonObject(self: OrumIoConfig): any;
};
