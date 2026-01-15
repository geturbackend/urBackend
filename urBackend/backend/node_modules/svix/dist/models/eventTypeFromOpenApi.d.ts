export interface EventTypeFromOpenApi {
    deprecated: boolean;
    description: string;
    featureFlag?: string | null;
    featureFlags?: string[] | null;
    groupName?: string | null;
    name: string;
    schemas?: any | null;
}
export declare const EventTypeFromOpenApiSerializer: {
    _fromJsonObject(object: any): EventTypeFromOpenApi;
    _toJsonObject(self: EventTypeFromOpenApi): any;
};
