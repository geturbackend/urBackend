import { EndpointMessageOut } from "./endpointMessageOut";
export interface ListResponseEndpointMessageOut {
    data: EndpointMessageOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseEndpointMessageOutSerializer: {
    _fromJsonObject(object: any): ListResponseEndpointMessageOut;
    _toJsonObject(self: ListResponseEndpointMessageOut): any;
};
