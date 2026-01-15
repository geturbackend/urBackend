export interface EventTypeImportOpenApiIn {
    dryRun?: boolean;
    replaceAll?: boolean;
    spec?: any | null;
    specRaw?: string | null;
}
export declare const EventTypeImportOpenApiInSerializer: {
    _fromJsonObject(object: any): EventTypeImportOpenApiIn;
    _toJsonObject(self: EventTypeImportOpenApiIn): any;
};
