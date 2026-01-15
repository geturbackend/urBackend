export interface ReplayIn {
    since: Date;
    until?: Date | null;
}
export declare const ReplayInSerializer: {
    _fromJsonObject(object: any): ReplayIn;
    _toJsonObject(self: ReplayIn): any;
};
