export interface TelnyxConfigOut {
    publicKey: string;
}
export declare const TelnyxConfigOutSerializer: {
    _fromJsonObject(object: any): TelnyxConfigOut;
    _toJsonObject(self: TelnyxConfigOut): any;
};
