import { MessageEndpointOut } from "./messageEndpointOut";
export interface ListResponseMessageEndpointOut {
    data: MessageEndpointOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseMessageEndpointOutSerializer: {
    _fromJsonObject(object: any): ListResponseMessageEndpointOut;
    _toJsonObject(self: ListResponseMessageEndpointOut): any;
};
