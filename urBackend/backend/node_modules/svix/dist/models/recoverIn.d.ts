export interface RecoverIn {
    since: Date;
    until?: Date | null;
}
export declare const RecoverInSerializer: {
    _fromJsonObject(object: any): RecoverIn;
    _toJsonObject(self: RecoverIn): any;
};
