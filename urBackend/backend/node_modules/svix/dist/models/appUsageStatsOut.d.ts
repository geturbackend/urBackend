import { BackgroundTaskStatus } from "./backgroundTaskStatus";
import { BackgroundTaskType } from "./backgroundTaskType";
export interface AppUsageStatsOut {
    id: string;
    status: BackgroundTaskStatus;
    task: BackgroundTaskType;
    unresolvedAppIds: string[];
}
export declare const AppUsageStatsOutSerializer: {
    _fromJsonObject(object: any): AppUsageStatsOut;
    _toJsonObject(self: AppUsageStatsOut): any;
};
