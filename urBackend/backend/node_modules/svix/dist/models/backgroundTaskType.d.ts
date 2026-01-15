export declare enum BackgroundTaskType {
    EndpointReplay = "endpoint.replay",
    EndpointRecover = "endpoint.recover",
    ApplicationStats = "application.stats",
    MessageBroadcast = "message.broadcast",
    SdkGenerate = "sdk.generate",
    EventTypeAggregate = "event-type.aggregate",
    ApplicationPurgeContent = "application.purge_content"
}
export declare const BackgroundTaskTypeSerializer: {
    _fromJsonObject(object: any): BackgroundTaskType;
    _toJsonObject(self: BackgroundTaskType): any;
};
