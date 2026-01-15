export interface RutterConfig {
    secret: string;
}
export declare const RutterConfigSerializer: {
    _fromJsonObject(object: any): RutterConfig;
    _toJsonObject(self: RutterConfig): any;
};
