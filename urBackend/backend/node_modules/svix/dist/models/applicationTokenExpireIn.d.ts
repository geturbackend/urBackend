export interface ApplicationTokenExpireIn {
    expiry?: number | null;
    sessionIds?: string[];
}
export declare const ApplicationTokenExpireInSerializer: {
    _fromJsonObject(object: any): ApplicationTokenExpireIn;
    _toJsonObject(self: ApplicationTokenExpireIn): any;
};
