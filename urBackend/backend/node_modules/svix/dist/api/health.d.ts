import { SvixRequestContext } from "../request";
export declare class Health {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    get(): Promise<void>;
}
