import { BackgroundTaskStatus } from "./backgroundTaskStatus";
import { BackgroundTaskType } from "./backgroundTaskType";
export interface AggregateEventTypesOut {
    id: string;
    status: BackgroundTaskStatus;
    task: BackgroundTaskType;
}
export declare const AggregateEventTypesOutSerializer: {
    _fromJsonObject(object: any): AggregateEventTypesOut;
    _toJsonObject(self: AggregateEventTypesOut): any;
};
