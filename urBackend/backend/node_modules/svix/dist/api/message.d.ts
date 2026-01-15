import { ExpungeAllContentsOut } from "../models/expungeAllContentsOut";
import { ListResponseMessageOut } from "../models/listResponseMessageOut";
import { MessageOut } from "../models/messageOut";
import { MessagePoller } from "./messagePoller";
import { SvixRequestContext } from "../request";
import { MessageIn } from "../models/messageIn";
export interface MessageListOptions {
    limit?: number;
    iterator?: string | null;
    channel?: string;
    before?: Date | null;
    after?: Date | null;
    withContent?: boolean;
    tag?: string;
    eventTypes?: string[];
}
export interface MessageCreateOptions {
    withContent?: boolean;
    idempotencyKey?: string;
}
export interface MessageExpungeAllContentsOptions {
    idempotencyKey?: string;
}
export interface MessageGetOptions {
    withContent?: boolean;
}
export declare class Message {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    get poller(): MessagePoller;
    list(appId: string, options?: MessageListOptions): Promise<ListResponseMessageOut>;
    create(appId: string, messageIn: MessageIn, options?: MessageCreateOptions): Promise<MessageOut>;
    expungeAllContents(appId: string, options?: MessageExpungeAllContentsOptions): Promise<ExpungeAllContentsOut>;
    get(appId: string, msgId: string, options?: MessageGetOptions): Promise<MessageOut>;
    expungeContent(appId: string, msgId: string): Promise<void>;
}
export declare function messageInRaw(eventType: string, payload: string, contentType?: string): MessageIn;
