export interface EventTypeIn {
    archived?: boolean;
    deprecated?: boolean;
    description: string;
    featureFlag?: string | null;
    featureFlags?: string[] | null;
    groupName?: string | null;
    name: string;
    schemas?: any | null;
}
export declare const EventTypeInSerializer: {
    _fromJsonObject(object: any): EventTypeIn;
    _toJsonObject(self: EventTypeIn): any;
};
