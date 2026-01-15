import { EventTypeFromOpenApi } from "./eventTypeFromOpenApi";
export interface EventTypeImportOpenApiOutData {
    modified: string[];
    toModify?: EventTypeFromOpenApi[] | null;
}
export declare const EventTypeImportOpenApiOutDataSerializer: {
    _fromJsonObject(object: any): EventTypeImportOpenApiOutData;
    _toJsonObject(self: EventTypeImportOpenApiOutData): any;
};
