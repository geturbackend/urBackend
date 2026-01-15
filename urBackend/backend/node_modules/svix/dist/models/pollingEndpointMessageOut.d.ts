export interface PollingEndpointMessageOut {
    channels?: string[] | null;
    eventId?: string | null;
    eventType: string;
    headers?: {
        [key: string]: string;
    } | null;
    id: string;
    payload: any;
    tags?: string[] | null;
    timestamp: Date;
}
export declare const PollingEndpointMessageOutSerializer: {
    _fromJsonObject(object: any): PollingEndpointMessageOut;
    _toJsonObject(self: PollingEndpointMessageOut): any;
};
