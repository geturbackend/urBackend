export interface IntegrationUpdate {
    featureFlags?: string[];
    name: string;
}
export declare const IntegrationUpdateSerializer: {
    _fromJsonObject(object: any): IntegrationUpdate;
    _toJsonObject(self: IntegrationUpdate): any;
};
