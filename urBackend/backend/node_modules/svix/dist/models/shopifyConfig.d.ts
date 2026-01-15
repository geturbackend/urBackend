export interface ShopifyConfig {
    secret: string;
}
export declare const ShopifyConfigSerializer: {
    _fromJsonObject(object: any): ShopifyConfig;
    _toJsonObject(self: ShopifyConfig): any;
};
