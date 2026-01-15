export declare enum ConnectorKind {
    Custom = "Custom",
    CloseCrm = "CloseCRM",
    CustomerIo = "CustomerIO",
    Discord = "Discord",
    Hubspot = "Hubspot",
    Inngest = "Inngest",
    Loops = "Loops",
    Resend = "Resend",
    Salesforce = "Salesforce",
    Segment = "Segment",
    Sendgrid = "Sendgrid",
    Slack = "Slack",
    Teams = "Teams",
    TriggerDev = "TriggerDev",
    Windmill = "Windmill",
    Zapier = "Zapier"
}
export declare const ConnectorKindSerializer: {
    _fromJsonObject(object: any): ConnectorKind;
    _toJsonObject(self: ConnectorKind): any;
};
