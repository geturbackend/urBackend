import { MessageOut } from "./messageOut";
export interface ListResponseMessageOut {
    data: MessageOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseMessageOutSerializer: {
    _fromJsonObject(object: any): ListResponseMessageOut;
    _toJsonObject(self: ListResponseMessageOut): any;
};
