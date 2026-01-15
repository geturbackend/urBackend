export interface EasypostConfig {
    secret?: string | null;
}
export declare const EasypostConfigSerializer: {
    _fromJsonObject(object: any): EasypostConfig;
    _toJsonObject(self: EasypostConfig): any;
};
