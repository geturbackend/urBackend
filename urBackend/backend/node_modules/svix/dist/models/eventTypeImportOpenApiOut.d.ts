import { EventTypeImportOpenApiOutData } from "./eventTypeImportOpenApiOutData";
export interface EventTypeImportOpenApiOut {
    data: EventTypeImportOpenApiOutData;
}
export declare const EventTypeImportOpenApiOutSerializer: {
    _fromJsonObject(object: any): EventTypeImportOpenApiOut;
    _toJsonObject(self: EventTypeImportOpenApiOut): any;
};
