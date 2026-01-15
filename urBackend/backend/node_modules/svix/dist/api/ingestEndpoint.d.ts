import { IngestEndpointHeadersIn } from "../models/ingestEndpointHeadersIn";
import { IngestEndpointHeadersOut } from "../models/ingestEndpointHeadersOut";
import { IngestEndpointIn } from "../models/ingestEndpointIn";
import { IngestEndpointOut } from "../models/ingestEndpointOut";
import { IngestEndpointSecretIn } from "../models/ingestEndpointSecretIn";
import { IngestEndpointSecretOut } from "../models/ingestEndpointSecretOut";
import { IngestEndpointTransformationOut } from "../models/ingestEndpointTransformationOut";
import { IngestEndpointTransformationPatch } from "../models/ingestEndpointTransformationPatch";
import { IngestEndpointUpdate } from "../models/ingestEndpointUpdate";
import { ListResponseIngestEndpointOut } from "../models/listResponseIngestEndpointOut";
import { Ordering } from "../models/ordering";
import { SvixRequestContext } from "../request";
export interface IngestEndpointListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export interface IngestEndpointCreateOptions {
    idempotencyKey?: string;
}
export interface IngestEndpointRotateSecretOptions {
    idempotencyKey?: string;
}
export declare class IngestEndpoint {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(sourceId: string, options?: IngestEndpointListOptions): Promise<ListResponseIngestEndpointOut>;
    create(sourceId: string, ingestEndpointIn: IngestEndpointIn, options?: IngestEndpointCreateOptions): Promise<IngestEndpointOut>;
    get(sourceId: string, endpointId: string): Promise<IngestEndpointOut>;
    update(sourceId: string, endpointId: string, ingestEndpointUpdate: IngestEndpointUpdate): Promise<IngestEndpointOut>;
    delete(sourceId: string, endpointId: string): Promise<void>;
    getHeaders(sourceId: string, endpointId: string): Promise<IngestEndpointHeadersOut>;
    updateHeaders(sourceId: string, endpointId: string, ingestEndpointHeadersIn: IngestEndpointHeadersIn): Promise<void>;
    getSecret(sourceId: string, endpointId: string): Promise<IngestEndpointSecretOut>;
    rotateSecret(sourceId: string, endpointId: string, ingestEndpointSecretIn: IngestEndpointSecretIn, options?: IngestEndpointRotateSecretOptions): Promise<void>;
    getTransformation(sourceId: string, endpointId: string): Promise<IngestEndpointTransformationOut>;
    setTransformation(sourceId: string, endpointId: string, ingestEndpointTransformationPatch: IngestEndpointTransformationPatch): Promise<void>;
}
