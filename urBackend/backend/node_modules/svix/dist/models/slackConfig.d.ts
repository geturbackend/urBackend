export interface SlackConfig {
    secret: string;
}
export declare const SlackConfigSerializer: {
    _fromJsonObject(object: any): SlackConfig;
    _toJsonObject(self: SlackConfig): any;
};
