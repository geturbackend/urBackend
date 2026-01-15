export interface PandaDocConfig {
    secret: string;
}
export declare const PandaDocConfigSerializer: {
    _fromJsonObject(object: any): PandaDocConfig;
    _toJsonObject(self: PandaDocConfig): any;
};
