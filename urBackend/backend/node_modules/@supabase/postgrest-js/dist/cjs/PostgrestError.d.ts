/**
 * Error format
 *
 * {@link https://postgrest.org/en/stable/api.html?highlight=options#errors-and-http-status-codes}
 */
export default class PostgrestError extends Error {
    details: string;
    hint: string;
    code: string;
    /**
     * @example
     * ```ts
     * import PostgrestError from '@supabase/postgrest-js'
     *
     * throw new PostgrestError({
     *   message: 'Row level security prevented the request',
     *   details: 'RLS denied the insert',
     *   hint: 'Check your policies',
     *   code: 'PGRST301',
     * })
     * ```
     */
    constructor(context: {
        message: string;
        details: string;
        hint: string;
        code: string;
    });
}
//# sourceMappingURL=PostgrestError.d.ts.map