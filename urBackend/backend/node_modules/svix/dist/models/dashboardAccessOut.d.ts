export interface DashboardAccessOut {
    token: string;
    url: string;
}
export declare const DashboardAccessOutSerializer: {
    _fromJsonObject(object: any): DashboardAccessOut;
    _toJsonObject(self: DashboardAccessOut): any;
};
