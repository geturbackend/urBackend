export interface AppPortalAccessOut {
    token: string;
    url: string;
}
export declare const AppPortalAccessOutSerializer: {
    _fromJsonObject(object: any): AppPortalAccessOut;
    _toJsonObject(self: AppPortalAccessOut): any;
};
