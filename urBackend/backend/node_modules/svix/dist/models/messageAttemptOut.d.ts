import { MessageAttemptTriggerType } from "./messageAttemptTriggerType";
import { MessageOut } from "./messageOut";
import { MessageStatus } from "./messageStatus";
import { MessageStatusText } from "./messageStatusText";
export interface MessageAttemptOut {
    endpointId: string;
    id: string;
    msg?: MessageOut | null;
    msgId: string;
    response: string;
    responseDurationMs: number;
    responseStatusCode: number;
    status: MessageStatus;
    statusText: MessageStatusText;
    timestamp: Date;
    triggerType: MessageAttemptTriggerType;
    url: string;
}
export declare const MessageAttemptOutSerializer: {
    _fromJsonObject(object: any): MessageAttemptOut;
    _toJsonObject(self: MessageAttemptOut): any;
};
