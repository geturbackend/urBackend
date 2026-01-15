export interface VeriffConfig {
    secret: string;
}
export declare const VeriffConfigSerializer: {
    _fromJsonObject(object: any): VeriffConfig;
    _toJsonObject(self: VeriffConfig): any;
};
