export interface AppUsageStatsIn {
    appIds?: string[] | null;
    since: Date;
    until: Date;
}
export declare const AppUsageStatsInSerializer: {
    _fromJsonObject(object: any): AppUsageStatsIn;
    _toJsonObject(self: AppUsageStatsIn): any;
};
