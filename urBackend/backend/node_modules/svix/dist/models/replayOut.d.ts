import { BackgroundTaskStatus } from "./backgroundTaskStatus";
import { BackgroundTaskType } from "./backgroundTaskType";
export interface ReplayOut {
    id: string;
    status: BackgroundTaskStatus;
    task: BackgroundTaskType;
}
export declare const ReplayOutSerializer: {
    _fromJsonObject(object: any): ReplayOut;
    _toJsonObject(self: ReplayOut): any;
};
