export declare enum MessageAttemptTriggerType {
    Scheduled = 0,
    Manual = 1
}
export declare const MessageAttemptTriggerTypeSerializer: {
    _fromJsonObject(object: any): MessageAttemptTriggerType;
    _toJsonObject(self: MessageAttemptTriggerType): any;
};
