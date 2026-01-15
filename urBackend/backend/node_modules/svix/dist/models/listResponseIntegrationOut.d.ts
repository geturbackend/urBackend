import { IntegrationOut } from "./integrationOut";
export interface ListResponseIntegrationOut {
    data: IntegrationOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseIntegrationOutSerializer: {
    _fromJsonObject(object: any): ListResponseIntegrationOut;
    _toJsonObject(self: ListResponseIntegrationOut): any;
};
