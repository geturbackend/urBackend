import { PollingEndpointConsumerSeekIn } from "../models/pollingEndpointConsumerSeekIn";
import { PollingEndpointConsumerSeekOut } from "../models/pollingEndpointConsumerSeekOut";
import { PollingEndpointOut } from "../models/pollingEndpointOut";
import { SvixRequestContext } from "../request";
export interface MessagePollerPollOptions {
    limit?: number;
    iterator?: string | null;
    eventType?: string;
    channel?: string;
    after?: Date | null;
}
export interface MessagePollerConsumerPollOptions {
    limit?: number;
    iterator?: string | null;
}
export interface MessagePollerConsumerSeekOptions {
    idempotencyKey?: string;
}
export declare class MessagePoller {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    poll(appId: string, sinkId: string, options?: MessagePollerPollOptions): Promise<PollingEndpointOut>;
    consumerPoll(appId: string, sinkId: string, consumerId: string, options?: MessagePollerConsumerPollOptions): Promise<PollingEndpointOut>;
    consumerSeek(appId: string, sinkId: string, consumerId: string, pollingEndpointConsumerSeekIn: PollingEndpointConsumerSeekIn, options?: MessagePollerConsumerSeekOptions): Promise<PollingEndpointConsumerSeekOut>;
}
