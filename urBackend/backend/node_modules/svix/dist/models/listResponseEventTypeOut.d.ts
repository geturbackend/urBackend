import { EventTypeOut } from "./eventTypeOut";
export interface ListResponseEventTypeOut {
    data: EventTypeOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseEventTypeOutSerializer: {
    _fromJsonObject(object: any): ListResponseEventTypeOut;
    _toJsonObject(self: ListResponseEventTypeOut): any;
};
