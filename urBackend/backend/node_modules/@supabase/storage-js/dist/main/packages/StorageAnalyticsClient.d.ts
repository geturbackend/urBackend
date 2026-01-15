import { StorageError } from '../lib/errors';
import { Fetch } from '../lib/fetch';
import { AnalyticBucket } from '../lib/types';
/**
 * Client class for managing Analytics Buckets using Iceberg tables
 * Provides methods for creating, listing, and deleting analytics buckets
 */
export default class StorageAnalyticsClient {
    protected url: string;
    protected headers: {
        [key: string]: string;
    };
    protected fetch: Fetch;
    protected shouldThrowOnError: boolean;
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
    constructor(url: string, headers?: {
        [key: string]: string;
    }, fetch?: Fetch);
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
    throwOnError(): this;
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
    createBucket(name: string): Promise<{
        data: AnalyticBucket;
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
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
    listBuckets(options?: {
        limit?: number;
        offset?: number;
        sortColumn?: 'id' | 'name' | 'created_at' | 'updated_at';
        sortOrder?: 'asc' | 'desc';
        search?: string;
    }): Promise<{
        data: AnalyticBucket[];
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
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
    deleteBucket(bucketName: string): Promise<{
        data: {
            message: string;
        };
        error: null;
    } | {
        data: null;
        error: StorageError;
    }>;
}
//# sourceMappingURL=StorageAnalyticsClient.d.ts.map