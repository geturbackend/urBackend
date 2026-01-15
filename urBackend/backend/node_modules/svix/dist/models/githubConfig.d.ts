export interface GithubConfig {
    secret?: string | null;
}
export declare const GithubConfigSerializer: {
    _fromJsonObject(object: any): GithubConfig;
    _toJsonObject(self: GithubConfig): any;
};
