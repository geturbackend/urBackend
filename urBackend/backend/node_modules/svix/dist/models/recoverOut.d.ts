import { BackgroundTaskStatus } from "./backgroundTaskStatus";
import { BackgroundTaskType } from "./backgroundTaskType";
export interface RecoverOut {
    id: string;
    status: BackgroundTaskStatus;
    task: BackgroundTaskType;
}
export declare const RecoverOutSerializer: {
    _fromJsonObject(object: any): RecoverOut;
    _toJsonObject(self: RecoverOut): any;
};
