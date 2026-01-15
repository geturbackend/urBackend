import { OperationalWebhookEndpoint } from "./operationalWebhookEndpoint";
import { SvixRequestContext } from "../request";
export declare class OperationalWebhook {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    get endpoint(): OperationalWebhookEndpoint;
}
