import { AppPortalAccessIn } from "../models/appPortalAccessIn";
import { AppPortalAccessOut } from "../models/appPortalAccessOut";
import { ApplicationTokenExpireIn } from "../models/applicationTokenExpireIn";
import { DashboardAccessOut } from "../models/dashboardAccessOut";
import { SvixRequestContext } from "../request";
export interface AuthenticationAppPortalAccessOptions {
    idempotencyKey?: string;
}
export interface AuthenticationExpireAllOptions {
    idempotencyKey?: string;
}
export interface AuthenticationLogoutOptions {
    idempotencyKey?: string;
}
export interface AuthenticationDashboardAccessOptions {
    idempotencyKey?: string;
}
export declare class Authentication {
    private readonly requestCtx;
    constructor(requestCtx: SvixRequestContext);
    appPortalAccess(appId: string, appPortalAccessIn: AppPortalAccessIn, options?: AuthenticationAppPortalAccessOptions): Promise<AppPortalAccessOut>;
    expireAll(appId: string, applicationTokenExpireIn: ApplicationTokenExpireIn, options?: AuthenticationExpireAllOptions): Promise<void>;
    dashboardAccess(appId: string, options?: AuthenticationDashboardAccessOptions): Promise<DashboardAccessOut>;
    logout(options?: AuthenticationLogoutOptions): Promise<void>;
}
