import { IngestSourceIn } from "../models/ingestSourceIn";
import { IngestSourceOut } from "../models/ingestSourceOut";
import { ListResponseIngestSourceOut } from "../models/listResponseIngestSourceOut";
import { Ordering } from "../models/ordering";
import { RotateTokenOut } from "../models/rotateTokenOut";
import { SvixRequestContext } from "../request";
export interface IngestSourceListOptions {
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export interface IngestSourceCreateOptions {
    idempotencyKey?: string;
}
export interface IngestSourceRotateTokenOptions {
    idempotencyKey?: string;
}
export declare class IngestSource {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: IngestSourceListOptions): Promise<ListResponseIngestSourceOut>;
    create(ingestSourceIn: IngestSourceIn, options?: IngestSourceCreateOptions): Promise<IngestSourceOut>;
    get(sourceId: string): Promise<IngestSourceOut>;
    update(sourceId: string, ingestSourceIn: IngestSourceIn): Promise<IngestSourceOut>;
    delete(sourceId: string): Promise<void>;
    rotateToken(sourceId: string, options?: IngestSourceRotateTokenOptions): Promise<RotateTokenOut>;
}
