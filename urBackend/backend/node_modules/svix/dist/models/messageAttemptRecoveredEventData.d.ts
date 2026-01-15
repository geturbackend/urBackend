import { MessageAttemptFailedData } from "./messageAttemptFailedData";
export interface MessageAttemptRecoveredEventData {
    appId: string;
    appUid?: string | null;
    endpointId: string;
    lastAttempt: MessageAttemptFailedData;
    msgEventId?: string | null;
    msgId: string;
}
export declare const MessageAttemptRecoveredEventDataSerializer: {
    _fromJsonObject(object: any): MessageAttemptRecoveredEventData;
    _toJsonObject(self: MessageAttemptRecoveredEventData): any;
};
