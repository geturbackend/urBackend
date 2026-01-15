import { Application } from "./api/application";
import { Authentication } from "./api/authentication";
import { BackgroundTask } from "./api/backgroundTask";
import { Endpoint } from "./api/endpoint";
import { Environment } from "./api/environment";
import { EventType } from "./api/eventType";
import { Health } from "./api/health";
import { Ingest } from "./api/ingest";
import { Integration } from "./api/integration";
import { Message } from "./api/message";
import { MessageAttempt } from "./api/messageAttempt";
import { OperationalWebhook } from "./api/operationalWebhook";
import { Statistics } from "./api/statistics";
import { OperationalWebhookEndpoint } from "./api/operationalWebhookEndpoint";
export { PostOptions, ApiException } from "./util";
export { HTTPValidationError, HttpErrorOut, ValidationError } from "./HttpErrors";
export * from "./webhook";
export * from "./models/index";
import { XOR } from "./util";
export { ApplicationListOptions } from "./api/application";
export { BackgroundTaskListOptions } from "./api/backgroundTask";
export { EndpointListOptions, EndpointGetStatsOptions } from "./api/endpoint";
export { EventTypeListOptions } from "./api/eventType";
export { IntegrationListOptions } from "./api/integration";
export { MessageListOptions, messageInRaw } from "./api/message";
export { MessageAttemptListByEndpointOptions } from "./api/messageAttempt";
export { OperationalWebhookEndpointListOptions } from "./api/operationalWebhookEndpoint";
export type SvixOptions = {
    debug?: boolean;
    serverUrl?: string;
    requestTimeout?: number;
} & XOR<{
    retryScheduleInMs?: number[];
}, {
    numRetries?: number;
}>;
export declare class Svix {
    private readonly requestCtx;
    constructor(token: string, options?: SvixOptions);
    get application(): Application;
    get authentication(): Authentication;
    get backgroundTask(): BackgroundTask;
    get endpoint(): Endpoint;
    get environment(): Environment;
    get eventType(): EventType;
    get health(): Health;
    get ingest(): Ingest;
    get integration(): Integration;
    get message(): Message;
    get messageAttempt(): MessageAttempt;
    get operationalWebhook(): OperationalWebhook;
    get statistics(): Statistics;
    get operationalWebhookEndpoint(): OperationalWebhookEndpoint;
}
