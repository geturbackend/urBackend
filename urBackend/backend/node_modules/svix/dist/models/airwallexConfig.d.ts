export interface AirwallexConfig {
    secret: string;
}
export declare const AirwallexConfigSerializer: {
    _fromJsonObject(object: any): AirwallexConfig;
    _toJsonObject(self: AirwallexConfig): any;
};
