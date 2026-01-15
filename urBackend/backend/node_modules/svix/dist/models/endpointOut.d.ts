export interface EndpointOut {
    channels?: string[] | null;
    createdAt: Date;
    description: string;
    disabled?: boolean;
    filterTypes?: string[] | null;
    id: string;
    metadata: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    uid?: string | null;
    updatedAt: Date;
    url: string;
    version: number;
}
export declare const EndpointOutSerializer: {
    _fromJsonObject(object: any): EndpointOut;
    _toJsonObject(self: EndpointOut): any;
};
