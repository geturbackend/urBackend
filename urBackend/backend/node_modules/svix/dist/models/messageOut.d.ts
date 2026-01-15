export interface MessageOut {
    channels?: string[] | null;
    eventId?: string | null;
    eventType: string;
    id: string;
    payload: any;
    tags?: string[] | null;
    timestamp: Date;
}
export declare const MessageOutSerializer: {
    _fromJsonObject(object: any): MessageOut;
    _toJsonObject(self: MessageOut): any;
};
