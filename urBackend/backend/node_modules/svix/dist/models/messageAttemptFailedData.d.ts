export interface MessageAttemptFailedData {
    id: string;
    responseStatusCode: number;
    timestamp: Date;
}
export declare const MessageAttemptFailedDataSerializer: {
    _fromJsonObject(object: any): MessageAttemptFailedData;
    _toJsonObject(self: MessageAttemptFailedData): any;
};
