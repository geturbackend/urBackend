export interface EventTypePatch {
    archived?: boolean;
    deprecated?: boolean;
    description?: string;
    featureFlag?: string | null;
    featureFlags?: string[] | null;
    groupName?: string | null;
    schemas?: any | null;
}
export declare const EventTypePatchSerializer: {
    _fromJsonObject(object: any): EventTypePatch;
    _toJsonObject(self: EventTypePatch): any;
};
