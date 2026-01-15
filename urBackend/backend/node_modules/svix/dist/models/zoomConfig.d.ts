export interface ZoomConfig {
    secret: string;
}
export declare const ZoomConfigSerializer: {
    _fromJsonObject(object: any): ZoomConfig;
    _toJsonObject(self: ZoomConfig): any;
};
