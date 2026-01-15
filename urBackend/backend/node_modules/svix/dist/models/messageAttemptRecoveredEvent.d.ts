import { MessageAttemptRecoveredEventData } from "./messageAttemptRecoveredEventData";
export interface MessageAttemptRecoveredEvent {
    data: MessageAttemptRecoveredEventData;
    type: string;
}
export declare const MessageAttemptRecoveredEventSerializer: {
    _fromJsonObject(object: any): MessageAttemptRecoveredEvent;
    _toJsonObject(self: MessageAttemptRecoveredEvent): any;
};
