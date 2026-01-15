import { EndpointOut } from "./endpointOut";
export interface ListResponseEndpointOut {
    data: EndpointOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseEndpointOutSerializer: {
    _fromJsonObject(object: any): ListResponseEndpointOut;
    _toJsonObject(self: ListResponseEndpointOut): any;
};
