import { MessageAttemptFailedData } from "./messageAttemptFailedData";
export interface MessageAttemptFailingEventData {
    appId: string;
    appUid?: string | null;
    endpointId: string;
    lastAttempt: MessageAttemptFailedData;
    msgEventId?: string | null;
    msgId: string;
}
export declare const MessageAttemptFailingEventDataSerializer: {
    _fromJsonObject(object: any): MessageAttemptFailingEventData;
    _toJsonObject(self: MessageAttemptFailingEventData): any;
};
