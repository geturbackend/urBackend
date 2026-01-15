import { PollingEndpointMessageOut } from "./pollingEndpointMessageOut";
export interface PollingEndpointOut {
    data: PollingEndpointMessageOut[];
    done: boolean;
    iterator: string;
}
export declare const PollingEndpointOutSerializer: {
    _fromJsonObject(object: any): PollingEndpointOut;
    _toJsonObject(self: PollingEndpointOut): any;
};
