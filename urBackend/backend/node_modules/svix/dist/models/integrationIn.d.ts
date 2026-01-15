export interface IntegrationIn {
    featureFlags?: string[];
    name: string;
}
export declare const IntegrationInSerializer: {
    _fromJsonObject(object: any): IntegrationIn;
    _toJsonObject(self: IntegrationIn): any;
};
