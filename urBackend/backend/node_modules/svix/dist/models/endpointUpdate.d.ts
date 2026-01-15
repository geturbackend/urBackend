export interface EndpointUpdate {
    channels?: string[] | null;
    description?: string;
    disabled?: boolean;
    filterTypes?: string[] | null;
    metadata?: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    uid?: string | null;
    url: string;
    version?: number | null;
}
export declare const EndpointUpdateSerializer: {
    _fromJsonObject(object: any): EndpointUpdate;
    _toJsonObject(self: EndpointUpdate): any;
};
