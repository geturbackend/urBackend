/// <reference types="node" />
/// <reference types="node" />
declare class ExtendableError extends Error {
    constructor(message: any);
}
export declare class WebhookVerificationError extends ExtendableError {
    constructor(message: string);
}
export interface WebhookRequiredHeaders {
    "svix-id": string;
    "svix-timestamp": string;
    "svix-signature": string;
}
export interface WebhookUnbrandedRequiredHeaders {
    "webhook-id": string;
    "webhook-timestamp": string;
    "webhook-signature": string;
}
export interface WebhookOptions {
    format?: "raw";
}
export declare class Webhook {
    private static prefix;
    private readonly key;
    constructor(secret: string | Uint8Array, options?: WebhookOptions);
    verify(payload: string | Buffer, headers_: WebhookRequiredHeaders | WebhookUnbrandedRequiredHeaders | Record<string, string>): unknown;
    sign(msgId: string, timestamp: Date, payload: string | Buffer): string;
    private verifyTimestamp;
}
export {};
