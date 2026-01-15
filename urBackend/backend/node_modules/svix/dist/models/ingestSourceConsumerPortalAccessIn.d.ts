export interface IngestSourceConsumerPortalAccessIn {
    expiry?: number | null;
    readOnly?: boolean | null;
}
export declare const IngestSourceConsumerPortalAccessInSerializer: {
    _fromJsonObject(object: any): IngestSourceConsumerPortalAccessIn;
    _toJsonObject(self: IngestSourceConsumerPortalAccessIn): any;
};
