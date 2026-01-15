import { BackgroundTaskStatus } from "./backgroundTaskStatus";
import { BackgroundTaskType } from "./backgroundTaskType";
export interface BackgroundTaskFinishedEvent2 {
    data: any;
    status: BackgroundTaskStatus;
    task: BackgroundTaskType;
    taskId: string;
}
export declare const BackgroundTaskFinishedEvent2Serializer: {
    _fromJsonObject(object: any): BackgroundTaskFinishedEvent2;
    _toJsonObject(self: BackgroundTaskFinishedEvent2): any;
};
