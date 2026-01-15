import { BackgroundTaskStatus } from "./backgroundTaskStatus";
import { BackgroundTaskType } from "./backgroundTaskType";
export interface BackgroundTaskOut {
    data: any;
    id: string;
    status: BackgroundTaskStatus;
    task: BackgroundTaskType;
}
export declare const BackgroundTaskOutSerializer: {
    _fromJsonObject(object: any): BackgroundTaskOut;
    _toJsonObject(self: BackgroundTaskOut): any;
};
