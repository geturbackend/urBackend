export interface EndpointPatch {
    channels?: string[] | null;
    description?: string;
    disabled?: boolean;
    filterTypes?: string[] | null;
    metadata?: {
        [key: string]: string;
    };
    rateLimit?: number | null;
    secret?: string | null;
    uid?: string | null;
    url?: string;
    version?: number;
}
export declare const EndpointPatchSerializer: {
    _fromJsonObject(object: any): EndpointPatch;
    _toJsonObject(self: EndpointPatch): any;
};
