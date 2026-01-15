import { MessageAttemptOut } from "./messageAttemptOut";
export interface ListResponseMessageAttemptOut {
    data: MessageAttemptOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseMessageAttemptOutSerializer: {
    _fromJsonObject(object: any): ListResponseMessageAttemptOut;
    _toJsonObject(self: ListResponseMessageAttemptOut): any;
};
