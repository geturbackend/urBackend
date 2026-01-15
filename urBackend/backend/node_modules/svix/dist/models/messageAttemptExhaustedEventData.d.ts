import { MessageAttemptFailedData } from "./messageAttemptFailedData";
export interface MessageAttemptExhaustedEventData {
    appId: string;
    appUid?: string | null;
    endpointId: string;
    lastAttempt: MessageAttemptFailedData;
    msgEventId?: string | null;
    msgId: string;
}
export declare const MessageAttemptExhaustedEventDataSerializer: {
    _fromJsonObject(object: any): MessageAttemptExhaustedEventData;
    _toJsonObject(self: MessageAttemptExhaustedEventData): any;
};
