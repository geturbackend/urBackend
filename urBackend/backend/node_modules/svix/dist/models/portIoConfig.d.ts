export interface PortIoConfig {
    secret: string;
}
export declare const PortIoConfigSerializer: {
    _fromJsonObject(object: any): PortIoConfig;
    _toJsonObject(self: PortIoConfig): any;
};
