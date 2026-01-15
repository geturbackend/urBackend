import { MessageAttemptExhaustedEventData } from "./messageAttemptExhaustedEventData";
export interface MessageAttemptExhaustedEvent {
    data: MessageAttemptExhaustedEventData;
    type: string;
}
export declare const MessageAttemptExhaustedEventSerializer: {
    _fromJsonObject(object: any): MessageAttemptExhaustedEvent;
    _toJsonObject(self: MessageAttemptExhaustedEvent): any;
};
