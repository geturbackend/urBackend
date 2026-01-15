import { AppPortalCapability } from "./appPortalCapability";
import { ApplicationIn } from "./applicationIn";
export interface AppPortalAccessIn {
    application?: ApplicationIn | null;
    capabilities?: AppPortalCapability[] | null;
    expiry?: number | null;
    featureFlags?: string[];
    readOnly?: boolean | null;
    sessionId?: string | null;
}
export declare const AppPortalAccessInSerializer: {
    _fromJsonObject(object: any): AppPortalAccessIn;
    _toJsonObject(self: AppPortalAccessIn): any;
};
