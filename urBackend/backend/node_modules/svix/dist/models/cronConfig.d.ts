export interface CronConfig {
    contentType?: string | null;
    payload: string;
    schedule: string;
}
export declare const CronConfigSerializer: {
    _fromJsonObject(object: any): CronConfig;
    _toJsonObject(self: CronConfig): any;
};
