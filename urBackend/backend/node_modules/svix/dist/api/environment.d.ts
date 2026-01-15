import { EnvironmentIn } from "../models/environmentIn";
import { EnvironmentOut } from "../models/environmentOut";
import { SvixRequestContext } from "../request";
export interface EnvironmentExportOptions {
    idempotencyKey?: string;
}
export interface EnvironmentImportOptions {
    idempotencyKey?: string;
}
export declare class Environment {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    export(options?: EnvironmentExportOptions): Promise<EnvironmentOut>;
    import(environmentIn: EnvironmentIn, options?: EnvironmentImportOptions): Promise<void>;
}
