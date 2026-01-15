"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const constants_1 = require("../lib/constants");
const errors_1 = require("../lib/errors");
const fetch_1 = require("../lib/fetch");
const helpers_1 = require("../lib/helpers");
/**
 * Client class for managing Analytics Buckets using Iceberg tables
 * Provides methods for creating, listing, and deleting analytics buckets
 */
class StorageAnalyticsClient {
    /**
     * @alpha
     *
     * Creates a new StorageAnalyticsClient instance
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Analytics Buckets
     * @param url - The base URL for the storage API
     * @param headers - HTTP headers to include in requests
     * @param fetch - Optional custom fetch implementation
     *
     * @example
     * ```typescript
     * const client = new StorageAnalyticsClient(url, headers)
     * ```
     */
    constructor(url, headers = {}, fetch) {
        this.shouldThrowOnError = false;
        this.url = url.replace(/\/$/, '');
        this.headers = Object.assign(Object.assign({}, constants_1.DEFAULT_HEADERS), headers);
        this.fetch = (0, helpers_1.resolveFetch)(fetch);
    }
    /**
     * @alpha
     *
     * Enable throwing errors instead of returning them in the response
     * When enabled, failed operations will throw instead of returning { data: null, error }
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Analytics Buckets
     * @returns This instance for method chaining
     */
    throwOnError() {
        this.shouldThrowOnError = true;
        return this;
    }
    /**
     * @alpha
     *
     * Creates a new analytics bucket using Iceberg tables
     * Analytics buckets are optimized for analytical queries and data processing
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Analytics Buckets
     * @param name A unique name for the bucket you are creating
     * @returns Promise with newly created bucket name or error
     *
     * @example Create analytics bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .analytics
     *   .createBucket('analytics-data')
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": {
     *     "name": "analytics-data"
     *   },
     *   "error": null
     * }
     * ```
     */
    createBucket(name) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield (0, fetch_1.post)(this.fetch, `${this.url}/bucket`, { name }, { headers: this.headers });
                return { data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if ((0, errors_1.isStorageError)(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
    /**
     * @alpha
     *
     * Retrieves the details of all Analytics Storage buckets within an existing project
     * Only returns buckets of type 'ANALYTICS'
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Analytics Buckets
     * @param options Query parameters for listing buckets
     * @param options.limit Maximum number of buckets to return
     * @param options.offset Number of buckets to skip
     * @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
     * @param options.sortOrder Sort order ('asc' or 'desc')
     * @param options.search Search term to filter bucket names
     * @returns Promise with list of analytics buckets or error
     *
     * @example List analytics buckets
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .analytics
     *   .listBuckets({
     *     limit: 10,
     *     offset: 0,
     *     sortColumn: 'created_at',
     *     sortOrder: 'desc'
     *   })
     * ```
     *
     * Response:
     * ```json
     * {
     *   "data": [
     *     {
     *       "id": "analytics-data",
     *       "name": "analytics-data",
     *       "type": "ANALYTICS",
     *       "created_at": "2024-05-22T22:26:05.100Z",
     *       "updated_at": "2024-05-22T22:26:05.100Z"
     *     }
     *   ],
     *   "error": null
     * }
     * ```
     */
    listBuckets(options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                // Build query string from options
                const queryParams = new URLSearchParams();
                if ((options === null || options === void 0 ? void 0 : options.limit) !== undefined)
                    queryParams.set('limit', options.limit.toString());
                if ((options === null || options === void 0 ? void 0 : options.offset) !== undefined)
                    queryParams.set('offset', options.offset.toString());
                if (options === null || options === void 0 ? void 0 : options.sortColumn)
                    queryParams.set('sortColumn', options.sortColumn);
                if (options === null || options === void 0 ? void 0 : options.sortOrder)
                    queryParams.set('sortOrder', options.sortOrder);
                if (options === null || options === void 0 ? void 0 : options.search)
                    queryParams.set('search', options.search);
                const queryString = queryParams.toString();
                const url = queryString ? `${this.url}/bucket?${queryString}` : `${this.url}/bucket`;
                const data = yield (0, fetch_1.get)(this.fetch, url, { headers: this.headers });
                return { data: data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if ((0, errors_1.isStorageError)(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
    /**
     * @alpha
     *
     * Deletes an existing analytics bucket
     * A bucket can't be deleted with existing objects inside it
     * You must first empty the bucket before deletion
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Analytics Buckets
     * @param bucketName The unique identifier of the bucket you would like to delete
     * @returns Promise with success message or error
     *
     * @example Delete analytics bucket
     * ```js
     * const { data, error } = await supabase
     *   .storage
     *   .analytics
     *   .deleteBucket('analytics-data')
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
    deleteBucket(bucketName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield (0, fetch_1.remove)(this.fetch, `${this.url}/bucket/${bucketName}`, {}, { headers: this.headers });
                return { data, error: null };
            }
            catch (error) {
                if (this.shouldThrowOnError) {
                    throw error;
                }
                if ((0, errors_1.isStorageError)(error)) {
                    return { data: null, error };
                }
                throw error;
            }
        });
    }
}
exports.default = StorageAnalyticsClient;
//# sourceMappingURL=StorageAnalyticsClient.js.map