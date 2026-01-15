import { OperationalWebhookEndpointOut } from "./operationalWebhookEndpointOut";
export interface ListResponseOperationalWebhookEndpointOut {
    data: OperationalWebhookEndpointOut[];
    done: boolean;
    iterator: string | null;
    prevIterator?: string | null;
}
export declare const ListResponseOperationalWebhookEndpointOutSerializer: {
    _fromJsonObject(object: any): ListResponseOperationalWebhookEndpointOut;
    _toJsonObject(self: ListResponseOperationalWebhookEndpointOut): any;
};
