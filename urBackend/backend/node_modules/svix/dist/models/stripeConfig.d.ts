export interface StripeConfig {
    secret: string;
}
export declare const StripeConfigSerializer: {
    _fromJsonObject(object: any): StripeConfig;
    _toJsonObject(self: StripeConfig): any;
};
