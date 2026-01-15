export interface SegmentConfig {
    secret?: string | null;
}
export declare const SegmentConfigSerializer: {
    _fromJsonObject(object: any): SegmentConfig;
    _toJsonObject(self: SegmentConfig): any;
};
