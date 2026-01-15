export declare enum AppPortalCapability {
    ViewBase = "ViewBase",
    ViewEndpointSecret = "ViewEndpointSecret",
    ManageEndpointSecret = "ManageEndpointSecret",
    ManageTransformations = "ManageTransformations",
    CreateAttempts = "CreateAttempts",
    ManageEndpoint = "ManageEndpoint"
}
export declare const AppPortalCapabilitySerializer: {
    _fromJsonObject(object: any): AppPortalCapability;
    _toJsonObject(self: AppPortalCapability): any;
};
