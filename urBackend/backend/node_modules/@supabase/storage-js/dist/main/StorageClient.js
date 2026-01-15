"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageClient = void 0;
const tslib_1 = require("tslib");
const StorageFileApi_1 = tslib_1.__importDefault(require("./packages/StorageFileApi"));
const StorageBucketApi_1 = tslib_1.__importDefault(require("./packages/StorageBucketApi"));
const StorageAnalyticsClient_1 = tslib_1.__importDefault(require("./packages/StorageAnalyticsClient"));
const vectors_1 = require("./lib/vectors");
class StorageClient extends StorageBucketApi_1.default {
    /**
     * Creates a client for Storage buckets, files, analytics, and vectors.
     *
     * @category File Buckets
     * @example
     * ```ts
     * import { StorageClient } from '@supabase/storage-js'
     *
     * const storage = new StorageClient('https://xyzcompany.supabase.co/storage/v1', {
     *   apikey: 'public-anon-key',
     * })
     * const avatars = storage.from('avatars')
     * ```
     */
    constructor(url, headers = {}, fetch, opts) {
        super(url, headers, fetch, opts);
    }
    /**
     * Perform file operation in a bucket.
     *
     * @category File Buckets
     * @param id The bucket id to operate on.
     *
     * @example
     * ```typescript
     * const avatars = storage.from('avatars')
     * ```
     */
    from(id) {
        return new StorageFileApi_1.default(this.url, this.headers, id, this.fetch);
    }
    /**
     *
     * @alpha
     *
     * Access vector storage operations.
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @returns A StorageVectorsClient instance configured with the current storage settings.
     */
    get vectors() {
        return new vectors_1.StorageVectorsClient(this.url + '/vector', {
            headers: this.headers,
            fetch: this.fetch,
        });
    }
    /**
     *
     * @alpha
     *
     * Access analytics storage operations using Iceberg tables.
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Analytics Buckets
     * @returns A StorageAnalyticsClient instance configured with the current storage settings.
     * @example
     * ```typescript
     * const client = createClient(url, key)
     * const analytics = client.storage.analytics
     *
     * // Create an analytics bucket
     * await analytics.createBucket('my-analytics-bucket')
     *
     * // List all analytics buckets
     * const { data: buckets } = await analytics.listBuckets()
     *
     * // Delete an analytics bucket
     * await analytics.deleteBucket('old-analytics-bucket')
     * ```
     */
    get analytics() {
        return new StorageAnalyticsClient_1.default(this.url + '/iceberg', this.headers, this.fetch);
    }
}
exports.StorageClient = StorageClient;
//# sourceMappingURL=StorageClient.js.map