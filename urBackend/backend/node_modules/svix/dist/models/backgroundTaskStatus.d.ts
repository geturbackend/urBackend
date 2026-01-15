export declare enum BackgroundTaskStatus {
    Running = "running",
    Finished = "finished",
    Failed = "failed"
}
export declare const BackgroundTaskStatusSerializer: {
    _fromJsonObject(object: any): BackgroundTaskStatus;
    _toJsonObject(self: BackgroundTaskStatus): any;
};
