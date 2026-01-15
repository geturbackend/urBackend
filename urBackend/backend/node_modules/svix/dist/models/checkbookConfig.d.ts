export interface CheckbookConfig {
    secret: string;
}
export declare const CheckbookConfigSerializer: {
    _fromJsonObject(object: any): CheckbookConfig;
    _toJsonObject(self: CheckbookConfig): any;
};
