export interface EventTypeUpdate {
    archived?: boolean;
    deprecated?: boolean;
    description: string;
    featureFlag?: string | null;
    featureFlags?: string[] | null;
    groupName?: string | null;
    schemas?: any | null;
}
export declare const EventTypeUpdateSerializer: {
    _fromJsonObject(object: any): EventTypeUpdate;
    _toJsonObject(self: EventTypeUpdate): any;
};
