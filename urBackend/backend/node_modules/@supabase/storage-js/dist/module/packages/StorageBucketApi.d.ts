import { StorageError } from '../lib/errors';
import { Fetch } from '../lib/fetch';
import { Bucket, BucketType, ListBucketOptions } from '../lib/types';
import { StorageClientOptions } from '../StorageClient';
export default class StorageBucketApi {
    protected url: string;
    protected headers: {
        [key: string]: string;
    };
    protected fetch: Fetch;
    protected shouldThrowOnError: boolean;
    constructor(url: string, headers?: {
        [key: string]: string;
    }, fetch?: Fetch, opts?: StorageClientOptions);
    /**
     * Enable throwing errors instead of returning them.
     *
     * @category File Buckets
     */
    throwOnError(): this;
    /**
     * Retrieves the details of all Storage buckets within an existing project.
     *
     * @category File Buckets
     * @param options Query parameters for listing buckets
     * @param options.limit Maximum number of buckets to return
     * @param options.offset Number of buckets to skip
     * @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
     * @param options.sortOrder Sort order ('asc' or 'desc')
     * @param options.search Search term to filter bucket names
     * @returns Promise with list of buckets or error
     *
     * @example List buckets
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .listBuckets()
     * ```
     *
     * @example List buckets with options
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .listBuckets({
     *     limit: 10,
     *     offset: 0,
     *     sortColumn: 'created_at',
     *     sortOrder: 'desc',
     *     search: 'prod'
     *   })
     * ```
     */
    listBuckets(options?: ListBucketOptions): Promise<{
        data: Bucket[];
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Retrieves the details of an existing Storage bucket.
     *
     * @category File Buckets
     * @param id The unique identifier of the bucket you would like to retrieve.
     * @returns Promise with bucket details or error
     *
     * @example Get bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .getBucket('avatars')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "id": "avatars",
     *     "name": "avatars",
     *     "owner": "",
     *     "public": false,
     *     "file_size_limit": 1024,
     *     "allowed_mime_types": [
     *       "image/png"
     *     ],
     *     "created_at": "2024-05-22T22:26:05.100Z",
     *     "updated_at": "2024-05-22T22:26:05.100Z"
     *   },
     *   "error": null
     * }
     * ```
     */
    getBucket(id: string): Promise<{
        data: Bucket;
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Creates a new Storage bucket
     *
     * @category File Buckets
     * @param id A unique identifier for the bucket you are creating.
     * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
     * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
     * The global file size limit takes precedence over this value.
     * The default value is null, which doesn't set a per bucket file size limit.
     * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
     * The default value is null, which allows files with all mime types to be uploaded.
     * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
     * @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
     *   - default bucket type is `STANDARD`
     * @returns Promise with newly created bucket id or error
     *
     * @example Create bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .createBucket('avatars', {
     *     public: false,
     *     allowedMimeTypes: ['image/png'],
     *     fileSizeLimit: 1024
     *   })
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "name": "avatars"
     *   },
     *   "error": null
     * }
     * ```
     */
    createBucket(id: string, options?: {
        public: boolean;
        fileSizeLimit?: number | string | null;
        allowedMimeTypes?: string[] | null;
        type?: BucketType;
    }): Promise<{
        data: Pick<Bucket, 'name'>;
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Updates a Storage bucket
     *
     * @category File Buckets
     * @param id A unique identifier for the bucket you are updating.
     * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
     * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
     * The global file size limit takes precedence over this value.
     * The default value is null, which doesn't set a per bucket file size limit.
     * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
     * The default value is null, which allows files with all mime types to be uploaded.
     * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
     * @returns Promise with success message or error
     *
     * @example Update bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .updateBucket('avatars', {
     *     public: false,
     *     allowedMimeTypes: ['image/png'],
     *     fileSizeLimit: 1024
     *   })
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "message": "Successfully updated"
     *   },
     *   "error": null
     * }
     * ```
     */
    updateBucket(id: string, options: {
        public: boolean;
        fileSizeLimit?: number | string | null;
        allowedMimeTypes?: string[] | null;
    }): Promise<{
        data: {
            message: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Removes all objects inside a single bucket.
     *
     * @category File Buckets
     * @param id The unique identifier of the bucket you would like to empty.
     * @returns Promise with success message or error
     *
     * @example Empty bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .emptyBucket('avatars')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "message": "Successfully emptied"
     *   },
     *   "error": null
     * }
     * ```
     */
    emptyBucket(id: string): Promise<{
        data: {
            message: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    /**
     * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
     * You must first `empty()` the bucket.
     *
     * @category File Buckets
     * @param id The unique identifier of the bucket you would like to delete.
     * @returns Promise with success message or error
     *
     * @example Delete bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .deleteBucket('avatars')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "message": "Successfully deleted"
     *   },
     *   "error": null
     * }
     * ```
     */
    deleteBucket(id: string): Promise<{
        data: {
            message: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
    private listBucketOptionsToQueryString;
}
//# sourceMappingURL=StorageBucketApi.d.ts.map