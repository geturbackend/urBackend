import { ListResponseOperationalWebhookEndpointOut } from "../models/listResponseOperationalWebhookEndpointOut";
import { OperationalWebhookEndpointHeadersIn } from "../models/operationalWebhookEndpointHeadersIn";
import { OperationalWebhookEndpointHeadersOut } from "../models/operationalWebhookEndpointHeadersOut";
import { OperationalWebhookEndpointIn } from "../models/operationalWebhookEndpointIn";
import { OperationalWebhookEndpointOut } from "../models/operationalWebhookEndpointOut";
import { OperationalWebhookEndpointSecretIn } from "../models/operationalWebhookEndpointSecretIn";
import { OperationalWebhookEndpointSecretOut } from "../models/operationalWebhookEndpointSecretOut";
import { OperationalWebhookEndpointUpdate } from "../models/operationalWebhookEndpointUpdate";
import { Ordering } from "../models/ordering";
import { SvixRequestContext } from "../request";
export interface OperationalWebhookEndpointListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export interface OperationalWebhookEndpointCreateOptions {
    idempotencyKey?: string;
}
export interface OperationalWebhookEndpointRotateSecretOptions {
    idempotencyKey?: string;
}
export declare class OperationalWebhookEndpoint {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: OperationalWebhookEndpointListOptions): Promise<ListResponseOperationalWebhookEndpointOut>;
    create(operationalWebhookEndpointIn: OperationalWebhookEndpointIn, options?: OperationalWebhookEndpointCreateOptions): Promise<OperationalWebhookEndpointOut>;
    get(endpointId: string): Promise<OperationalWebhookEndpointOut>;
    update(endpointId: string, operationalWebhookEndpointUpdate: OperationalWebhookEndpointUpdate): Promise<OperationalWebhookEndpointOut>;
    delete(endpointId: string): Promise<void>;
    getHeaders(endpointId: string): Promise<OperationalWebhookEndpointHeadersOut>;
    updateHeaders(endpointId: string, operationalWebhookEndpointHeadersIn: OperationalWebhookEndpointHeadersIn): Promise<void>;
    getSecret(endpointId: string): Promise<OperationalWebhookEndpointSecretOut>;
    rotateSecret(endpointId: string, operationalWebhookEndpointSecretIn: OperationalWebhookEndpointSecretIn, options?: OperationalWebhookEndpointRotateSecretOptions): Promise<void>;
}
