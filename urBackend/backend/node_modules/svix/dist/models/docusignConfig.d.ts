export interface DocusignConfig {
    secret?: string | null;
}
export declare const DocusignConfigSerializer: {
    _fromJsonObject(object: any): DocusignConfig;
    _toJsonObject(self: DocusignConfig): any;
};
