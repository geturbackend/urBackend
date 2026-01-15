export interface ApplicationIn {
    metadata?: {
        [key: string]: string;
    };
    name: string;
    rateLimit?: number | null;
    uid?: string | null;
}
export declare const ApplicationInSerializer: {
    _fromJsonObject(object: any): ApplicationIn;
    _toJsonObject(self: ApplicationIn): any;
};
