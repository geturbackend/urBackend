export interface ApplicationPatch {
    metadata?: {
        [key: string]: string;
    };
    name?: string;
    rateLimit?: number | null;
    uid?: string | null;
}
export declare const ApplicationPatchSerializer: {
    _fromJsonObject(object: any): ApplicationPatch;
    _toJsonObject(self: ApplicationPatch): any;
};
