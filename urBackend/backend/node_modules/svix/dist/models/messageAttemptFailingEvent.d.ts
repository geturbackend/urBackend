import { MessageAttemptFailingEventData } from "./messageAttemptFailingEventData";
export interface MessageAttemptFailingEvent {
    data: MessageAttemptFailingEventData;
    type: string;
}
export declare const MessageAttemptFailingEventSerializer: {
    _fromJsonObject(object: any): MessageAttemptFailingEvent;
    _toJsonObject(self: MessageAttemptFailingEvent): any;
};
