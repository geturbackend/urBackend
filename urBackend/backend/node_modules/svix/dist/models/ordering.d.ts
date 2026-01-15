export declare enum Ordering {
    Ascending = "ascending",
    Descending = "descending"
}
export declare const OrderingSerializer: {
    _fromJsonObject(object: any): Ordering;
    _toJsonObject(self: Ordering): any;
};
