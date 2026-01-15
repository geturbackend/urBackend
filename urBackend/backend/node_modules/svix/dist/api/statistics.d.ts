import { AggregateEventTypesOut } from "../models/aggregateEventTypesOut";
import { AppUsageStatsIn } from "../models/appUsageStatsIn";
import { AppUsageStatsOut } from "../models/appUsageStatsOut";
import { SvixRequestContext } from "../request";
export interface StatisticsAggregateAppStatsOptions {
    idempotencyKey?: string;
}
export declare class Statistics {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    aggregateAppStats(appUsageStatsIn: AppUsageStatsIn, options?: StatisticsAggregateAppStatsOptions): Promise<AppUsageStatsOut>;
    aggregateEventTypes(): Promise<AggregateEventTypesOut>;
}
