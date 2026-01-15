import { BackgroundTaskFinishedEvent2 } from "./backgroundTaskFinishedEvent2";
export interface BackgroundTaskFinishedEvent {
    data: BackgroundTaskFinishedEvent2;
    type: string;
}
export declare const BackgroundTaskFinishedEventSerializer: {
    _fromJsonObject(object: any): BackgroundTaskFinishedEvent;
    _toJsonObject(self: BackgroundTaskFinishedEvent): any;
};
