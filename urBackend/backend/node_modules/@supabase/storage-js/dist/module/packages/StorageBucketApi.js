import { __awaiter } from "tslib";
import { DEFAULT_HEADERS } from '../lib/constants';
import { isStorageError } from '../lib/errors';
import { get, post, put, remove } from '../lib/fetch';
import { resolveFetch } from '../lib/helpers';
export default class StorageBucketApi {
    constructor(url, headers = {}, fetch, opts) {
        this.shouldThrowOnError = false;
        const baseUrl = new URL(url);
        // if legacy uri is used, replace with new storage host (disables request buffering to allow > 50GB uploads)
        // "project-ref.supabase.co" becomes "project-ref.storage.supabase.co"
        if (opts === null || opts === void 0 ? void 0 : opts.useNewHostname) {
            const isSupabaseHost = /supabase\.(co|in|red)$/.test(baseUrl.hostname);
            if (isSupabaseHost && !baseUrl.hostname.includes('storage.supabase.')) {
                baseUrl.hostname = baseUrl.hostname.replace('supabase.', 'storage.supabase.');
            }
        }
        this.url = baseUrl.href.replace(/\/$/, '');
        this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS), headers);
        this.fetch = resolveFetch(fetch);
    }
    /**
     * Enable throwing errors instead of returning them.
     *
     * @category File Buckets
     */
    throwOnError() {
        this.shouldThrowOnError = true;
        return this;
    }
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
    listBuckets(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const queryString = this.listBucketOptionsToQueryString(options);
                const data = yield get(this.fetch, `${this.url}/bucket${queryString}`, {
                    headers: this.headers,
                });
                return { data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if (isStorageError(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
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
    getBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield get(this.fetch, `${this.url}/bucket/${id}`, { headers: this.headers });
                return { data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if (isStorageError(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
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
    createBucket(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, options = {
            public: false,
        }) {
            try {
                const data = yield post(this.fetch, `${this.url}/bucket`, {
                    id,
                    name: id,
                    type: options.type,
                    public: options.public,
                    file_size_limit: options.fileSizeLimit,
                    allowed_mime_types: options.allowedMimeTypes,
                }, { headers: this.headers });
                return { data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if (isStorageError(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
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
    updateBucket(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield put(this.fetch, `${this.url}/bucket/${id}`, {
                    id,
                    name: id,
                    public: options.public,
                    file_size_limit: options.fileSizeLimit,
                    allowed_mime_types: options.allowedMimeTypes,
                }, { headers: this.headers });
                return { data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if (isStorageError(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
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
    emptyBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield post(this.fetch, `${this.url}/bucket/${id}/empty`, {}, { headers: this.headers });
                return { data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if (isStorageError(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
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
    deleteBucket(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield remove(this.fetch, `${this.url}/bucket/${id}`, {}, { headers: this.headers });
                return { data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if (isStorageError(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
    listBucketOptionsToQueryString(options) {
        const params = {};
        if (options) {
            if ('limit' in options) {
                params.limit = String(options.limit);
            }
            if ('offset' in options) {
                params.offset = String(options.offset);
            }
            if (options.search) {
                params.search = options.search;
            }
            if (options.sortColumn) {
                params.sortColumn = options.sortColumn;
            }
            if (options.sortOrder) {
                params.sortOrder = options.sortOrder;
            }
        }
        return Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : '';
    }
}
//# sourceMappingURL=StorageBucketApi.js.map