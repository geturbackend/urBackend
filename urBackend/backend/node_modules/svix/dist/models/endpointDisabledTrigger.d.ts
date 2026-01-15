export declare enum EndpointDisabledTrigger {
    Manual = "manual",
    Automatic = "automatic"
}
export declare const EndpointDisabledTriggerSerializer: {
    _fromJsonObject(object: any): EndpointDisabledTrigger;
    _toJsonObject(self: EndpointDisabledTrigger): any;
};
