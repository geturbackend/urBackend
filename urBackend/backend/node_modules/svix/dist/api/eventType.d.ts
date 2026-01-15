import { EventTypeImportOpenApiIn } from "../models/eventTypeImportOpenApiIn";
import { EventTypeImportOpenApiOut } from "../models/eventTypeImportOpenApiOut";
import { EventTypeIn } from "../models/eventTypeIn";
import { EventTypeOut } from "../models/eventTypeOut";
import { EventTypePatch } from "../models/eventTypePatch";
import { EventTypeUpdate } from "../models/eventTypeUpdate";
import { ListResponseEventTypeOut } from "../models/listResponseEventTypeOut";
import { Ordering } from "../models/ordering";
import { SvixRequestContext } from "../request";
export interface EventTypeListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
    includeArchived?: boolean;
    withContent?: boolean;
}
export interface EventTypeCreateOptions {
    idempotencyKey?: string;
}
export interface EventTypeImportOpenapiOptions {
    idempotencyKey?: string;
}
export interface EventTypeDeleteOptions {
    expunge?: boolean;
}
export declare class EventType {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: EventTypeListOptions): Promise<ListResponseEventTypeOut>;
    create(eventTypeIn: EventTypeIn, options?: EventTypeCreateOptions): Promise<EventTypeOut>;
    importOpenapi(eventTypeImportOpenApiIn: EventTypeImportOpenApiIn, options?: EventTypeImportOpenapiOptions): Promise<EventTypeImportOpenApiOut>;
    get(eventTypeName: string): Promise<EventTypeOut>;
    update(eventTypeName: string, eventTypeUpdate: EventTypeUpdate): Promise<EventTypeOut>;
    delete(eventTypeName: string, options?: EventTypeDeleteOptions): Promise<void>;
    patch(eventTypeName: string, eventTypePatch: EventTypePatch): Promise<EventTypeOut>;
}
