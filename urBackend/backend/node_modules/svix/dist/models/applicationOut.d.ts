export interface ApplicationOut {
    createdAt: Date;
    id: string;
    metadata: {
        [key: string]: string;
    };
    name: string;
    rateLimit?: number | null;
    uid?: string | null;
    updatedAt: Date;
}
export declare const ApplicationOutSerializer: {
    _fromJsonObject(object: any): ApplicationOut;
    _toJsonObject(self: ApplicationOut): any;
};
