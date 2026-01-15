import { BackgroundTaskStatus } from "./backgroundTaskStatus";
import { BackgroundTaskType } from "./backgroundTaskType";
export interface ExpungeAllContentsOut {
    id: string;
    status: BackgroundTaskStatus;
    task: BackgroundTaskType;
}
export declare const ExpungeAllContentsOutSerializer: {
    _fromJsonObject(object: any): ExpungeAllContentsOut;
    _toJsonObject(self: ExpungeAllContentsOut): any;
};
