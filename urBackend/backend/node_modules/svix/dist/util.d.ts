export interface PostOptions {
    idempotencyKey?: string;
}
export declare class ApiException<T> extends Error {
    code: number;
    body: T;
    headers: Record<string, string>;
    constructor(code: number, body: T, headers: Headers);
}
export type XOR<T, U> = (T & {
    [K in keyof U]?: never;
}) | (U & {
    [K in keyof T]?: never;
});
