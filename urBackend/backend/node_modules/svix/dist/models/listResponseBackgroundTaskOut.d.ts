import { BackgroundTaskOut } from "./backgroundTaskOut";
export interface ListResponseBackgroundTaskOut {
    data: BackgroundTaskOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseBackgroundTaskOutSerializer: {
    _fromJsonObject(object: any): ListResponseBackgroundTaskOut;
    _toJsonObject(self: ListResponseBackgroundTaskOut): any;
};
