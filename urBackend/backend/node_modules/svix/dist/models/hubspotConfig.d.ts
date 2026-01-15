export interface HubspotConfig {
    secret?: string | null;
}
export declare const HubspotConfigSerializer: {
    _fromJsonObject(object: any): HubspotConfig;
    _toJsonObject(self: HubspotConfig): any;
};
