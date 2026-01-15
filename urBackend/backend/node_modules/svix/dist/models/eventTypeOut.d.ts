export interface EventTypeOut {
    archived?: boolean;
    createdAt: Date;
    deprecated: boolean;
    description: string;
    featureFlag?: string | null;
    featureFlags?: string[] | null;
    groupName?: string | null;
    name: string;
    schemas?: any | null;
    updatedAt: Date;
}
export declare const EventTypeOutSerializer: {
    _fromJsonObject(object: any): EventTypeOut;
    _toJsonObject(self: EventTypeOut): any;
};
