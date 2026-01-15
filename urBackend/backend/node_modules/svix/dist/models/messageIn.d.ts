import { ApplicationIn } from "./applicationIn";
export interface MessageIn {
    application?: ApplicationIn | null;
    channels?: string[] | null;
    eventId?: string | null;
    eventType: string;
    payload: any;
    payloadRetentionHours?: number | null;
    payloadRetentionPeriod?: number | null;
    tags?: string[] | null;
    transformationsParams?: any | null;
}
export declare const MessageInSerializer: {
    _fromJsonObject(object: any): MessageIn;
    _toJsonObject(self: MessageIn): any;
};
