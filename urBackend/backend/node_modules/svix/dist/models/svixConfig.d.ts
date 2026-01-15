export interface SvixConfig {
    secret: string;
}
export declare const SvixConfigSerializer: {
    _fromJsonObject(object: any): SvixConfig;
    _toJsonObject(self: SvixConfig): any;
};
