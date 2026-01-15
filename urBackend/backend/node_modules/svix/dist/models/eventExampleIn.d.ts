export interface EventExampleIn {
    eventType: string;
    exampleIndex?: number;
}
export declare const EventExampleInSerializer: {
    _fromJsonObject(object: any): EventExampleIn;
    _toJsonObject(self: EventExampleIn): any;
};
