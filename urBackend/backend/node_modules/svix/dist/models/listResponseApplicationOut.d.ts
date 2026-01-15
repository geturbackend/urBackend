import { ApplicationOut } from "./applicationOut";
export interface ListResponseApplicationOut {
    data: ApplicationOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseApplicationOutSerializer: {
    _fromJsonObject(object: any): ListResponseApplicationOut;
    _toJsonObject(self: ListResponseApplicationOut): any;
};
