export declare enum MessageStatus {
    Success = 0,
    Pending = 1,
    Fail = 2,
    Sending = 3
}
export declare const MessageStatusSerializer: {
    _fromJsonObject(object: any): MessageStatus;
    _toJsonObject(self: MessageStatus): any;
};
