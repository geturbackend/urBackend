import { IngestEndpointOut } from "./ingestEndpointOut";
export interface ListResponseIngestEndpointOut {
    data: IngestEndpointOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseIngestEndpointOutSerializer: {
    _fromJsonObject(object: any): ListResponseIngestEndpointOut;
    _toJsonObject(self: ListResponseIngestEndpointOut): any;
};
