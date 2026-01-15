import { BackgroundTaskOut } from "../models/backgroundTaskOut";
import { BackgroundTaskStatus } from "../models/backgroundTaskStatus";
import { BackgroundTaskType } from "../models/backgroundTaskType";
import { ListResponseBackgroundTaskOut } from "../models/listResponseBackgroundTaskOut";
import { Ordering } from "../models/ordering";
import { SvixRequestContext } from "../request";
export interface BackgroundTaskListOptions {
    status?: BackgroundTaskStatus;
    task?: BackgroundTaskType;
    limit?: number;
    iterator?: string | null;
    order?: Ordering;
}
export declare class BackgroundTask {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    list(options?: BackgroundTaskListOptions): Promise<ListResponseBackgroundTaskOut>;
    listByEndpoint(options?: BackgroundTaskListOptions): Promise<ListResponseBackgroundTaskOut>;
    get(taskId: string): Promise<BackgroundTaskOut>;
}
