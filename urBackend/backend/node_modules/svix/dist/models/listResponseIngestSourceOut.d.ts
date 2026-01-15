import { IngestSourceOut } from "./ingestSourceOut";
export interface ListResponseIngestSourceOut {
    data: IngestSourceOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseIngestSourceOutSerializer: {
    _fromJsonObject(object: any): ListResponseIngestSourceOut;
    _toJsonObject(self: ListResponseIngestSourceOut): any;
};
