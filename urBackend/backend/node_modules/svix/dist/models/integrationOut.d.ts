export interface IntegrationOut {
    createdAt: Date;
    featureFlags?: string[];
    id: string;
    name: string;
    updatedAt: Date;
}
export declare const IntegrationOutSerializer: {
    _fromJsonObject(object: any): IntegrationOut;
    _toJsonObject(self: IntegrationOut): any;
};
