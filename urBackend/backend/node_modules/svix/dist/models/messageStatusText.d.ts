export declare enum MessageStatusText {
    Success = "success",
    Pending = "pending",
    Fail = "fail",
    Sending = "sending"
}
export declare const MessageStatusTextSerializer: {
    _fromJsonObject(object: any): MessageStatusText;
    _toJsonObject(self: MessageStatusText): any;
};
