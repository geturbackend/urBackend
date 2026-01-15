export interface EndpointStats {
    fail: number;
    pending: number;
    sending: number;
    success: number;
}
export declare const EndpointStatsSerializer: {
    _fromJsonObject(object: any): EndpointStats;
    _toJsonObject(self: EndpointStats): any;
};
