import { __awaiter } from "tslib";
import VectorIndexApi from './VectorIndexApi';
import VectorDataApi from './VectorDataApi';
import VectorBucketApi from './VectorBucketApi';
/**
 *
 * @alpha
 *
 * Main client for interacting with S3 Vectors API
 * Provides access to bucket, index, and vector data operations
 *
 * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
 *
 * **Usage Patterns:**
 *
 * 1. **Via StorageClient (recommended for most use cases):**
 * ```typescript
 * import { StorageClient } from '@supabase/storage-js'
 *
 * const storageClient = new StorageClient(url, headers)
 * const vectors = storageClient.vectors
 *
 * // Use vector operations
 * await vectors.createBucket('embeddings-prod')
 * const bucket = vectors.from('embeddings-prod')
 * await bucket.createIndex({ ... })
 * ```
 *
 * 2. **Standalone (for vector-only applications):**
 * ```typescript
 * import { StorageVectorsClient } from '@supabase/storage-js'
 *
 * const vectorsClient = new StorageVectorsClient('https://api.example.com', {
 *   headers: { 'Authorization': 'Bearer token' }
 * })
 *
 * // Access bucket operations
 * await vectorsClient.createBucket('embeddings-prod')
 *
 * // Access index operations via buckets
 * const bucket = vectorsClient.from('embeddings-prod')
 * await bucket.createIndex({
 *   indexName: 'documents',
 *   dataType: 'float32',
 *   dimension: 1536,
 *   distanceMetric: 'cosine'
 * })
 *
 * // Access vector operations via index
 * const index = bucket.index('documents')
 * await index.putVectors({
 *   vectors: [
 *     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
 *   ]
 * })
 *
 * // Query similar vectors
 * const { data } = await index.queryVectors({
 *   queryVector: { float32: [...] },
 *   topK: 5,
 *   returnDistance: true
 * })
 * ```
 */
export class StorageVectorsClient extends VectorBucketApi {
    /**
     * @alpha
     *
     * Creates a StorageVectorsClient that can manage buckets, indexes, and vectors.
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param url - Base URL of the Storage Vectors REST API.
     * @param options.headers - Optional headers (for example `Authorization`) applied to every request.
     * @param options.fetch - Optional custom `fetch` implementation for non-browser runtimes.
     *
     * @example
     * ```typescript
     * const client = new StorageVectorsClient(url, options)
     * ```
     */
    constructor(url, options = {}) {
        super(url, options.headers || {}, options.fetch);
    }
    /**
     *
     * @alpha
     *
     * Access operations for a specific vector bucket
     * Returns a scoped client for index and vector operations within the bucket
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param vectorBucketName - Name of the vector bucket
     * @returns Bucket-scoped client with index and vector operations
     *
     * @example
     * ```typescript
     * const bucket = client.bucket('embeddings-prod')
     *
     * // Create an index in this bucket
     * await bucket.createIndex({
     *   indexName: 'documents-openai',
     *   dataType: 'float32',
     *   dimension: 1536,
     *   distanceMetric: 'cosine'
     * })
     *
     * // List indexes in this bucket
     * const { data } = await bucket.listIndexes()
     * ```
     */
    from(vectorBucketName) {
        return new VectorBucketScope(this.url, this.headers, vectorBucketName, this.fetch);
    }
}
/**
 *
 * @alpha
 *
 * Scoped client for operations within a specific vector bucket
 * Provides index management and access to vector operations
 *
 * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
 */
export class VectorBucketScope extends VectorIndexApi {
    /**
     * @alpha
     *
     * Creates a helper that automatically scopes all index operations to the provided bucket.
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @example
     * ```typescript
     * const bucket = client.bucket('embeddings-prod')
     * ```
     */
    constructor(url, headers, vectorBucketName, fetch) {
        super(url, headers, fetch);
        this.vectorBucketName = vectorBucketName;
    }
    /**
     *
     * @alpha
     *
     * Creates a new vector index in this bucket
     * Convenience method that automatically includes the bucket name
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param options - Index configuration (vectorBucketName is automatically set)
     * @returns Promise with empty response on success or error
     *
     * @example
     * ```typescript
     * const bucket = client.bucket('embeddings-prod')
     * await bucket.createIndex({
     *   indexName: 'documents-openai',
     *   dataType: 'float32',
     *   dimension: 1536,
     *   distanceMetric: 'cosine',
     *   metadataConfiguration: {
     *     nonFilterableMetadataKeys: ['raw_text']
     *   }
     * })
     * ```
     */
    createIndex(options) {
        const _super = Object.create(null, {
            createIndex: { get: () => super.createIndex }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.createIndex.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName }));
        });
    }
    /**
     *
     * @alpha
     *
     * Lists indexes in this bucket
     * Convenience method that automatically includes the bucket name
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param options - Listing options (vectorBucketName is automatically set)
     * @returns Promise with list of indexes or error
     *
     * @example
     * ```typescript
     * const bucket = client.bucket('embeddings-prod')
     * const { data } = await bucket.listIndexes({ prefix: 'documents-' })
     * ```
     */
    listIndexes() {
        const _super = Object.create(null, {
            listIndexes: { get: () => super.listIndexes }
        });
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            return _super.listIndexes.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName }));
        });
    }
    /**
     *
     * @alpha
     *
     * Retrieves metadata for a specific index in this bucket
     * Convenience method that automatically includes the bucket name
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param indexName - Name of the index to retrieve
     * @returns Promise with index metadata or error
     *
     * @example
     * ```typescript
     * const bucket = client.bucket('embeddings-prod')
     * const { data } = await bucket.getIndex('documents-openai')
     * console.log('Dimension:', data?.index.dimension)
     * ```
     */
    getIndex(indexName) {
        const _super = Object.create(null, {
            getIndex: { get: () => super.getIndex }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.getIndex.call(this, this.vectorBucketName, indexName);
        });
    }
    /**
     *
     * @alpha
     *
     * Deletes an index from this bucket
     * Convenience method that automatically includes the bucket name
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param indexName - Name of the index to delete
     * @returns Promise with empty response on success or error
     *
     * @example
     * ```typescript
     * const bucket = client.bucket('embeddings-prod')
     * await bucket.deleteIndex('old-index')
     * ```
     */
    deleteIndex(indexName) {
        const _super = Object.create(null, {
            deleteIndex: { get: () => super.deleteIndex }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.deleteIndex.call(this, this.vectorBucketName, indexName);
        });
    }
    /**
     *
     * @alpha
     *
     * Access operations for a specific index within this bucket
     * Returns a scoped client for vector data operations
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param indexName - Name of the index
     * @returns Index-scoped client with vector data operations
     *
     * @example
     * ```typescript
     * const index = client.bucket('embeddings-prod').index('documents-openai')
     *
     * // Insert vectors
     * await index.putVectors({
     *   vectors: [
     *     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
     *   ]
     * })
     *
     * // Query similar vectors
     * const { data } = await index.queryVectors({
     *   queryVector: { float32: [...] },
     *   topK: 5
     * })
     * ```
     */
    index(indexName) {
        return new VectorIndexScope(this.url, this.headers, this.vectorBucketName, indexName, this.fetch);
    }
}
/**
 *
 * @alpha
 *
 * Scoped client for operations within a specific vector index
 * Provides vector data operations (put, get, list, query, delete)
 *
 * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
 */
export class VectorIndexScope extends VectorDataApi {
    /**
     *
     * @alpha
     *
     * Creates a helper that automatically scopes all vector operations to the provided bucket/index names.
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @example
     * ```typescript
     * const index = client.bucket('embeddings-prod').index('documents-openai')
     * ```
     */
    constructor(url, headers, vectorBucketName, indexName, fetch) {
        super(url, headers, fetch);
        this.vectorBucketName = vectorBucketName;
        this.indexName = indexName;
    }
    /**
     *
     * @alpha
     *
     * Inserts or updates vectors in this index
     * Convenience method that automatically includes bucket and index names
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param options - Vector insertion options (bucket and index names automatically set)
     * @returns Promise with empty response on success or error
     *
     * @example
     * ```typescript
     * const index = client.bucket('embeddings-prod').index('documents-openai')
     * await index.putVectors({
     *   vectors: [
     *     {
     *       key: 'doc-1',
     *       data: { float32: [0.1, 0.2, ...] },
     *       metadata: { title: 'Introduction', page: 1 }
     *     }
     *   ]
     * })
     * ```
     */
    putVectors(options) {
        const _super = Object.create(null, {
            putVectors: { get: () => super.putVectors }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.putVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
    }
    /**
     *
     * @alpha
     *
     * Retrieves vectors by keys from this index
     * Convenience method that automatically includes bucket and index names
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param options - Vector retrieval options (bucket and index names automatically set)
     * @returns Promise with array of vectors or error
     *
     * @example
     * ```typescript
     * const index = client.bucket('embeddings-prod').index('documents-openai')
     * const { data } = await index.getVectors({
     *   keys: ['doc-1', 'doc-2'],
     *   returnMetadata: true
     * })
     * ```
     */
    getVectors(options) {
        const _super = Object.create(null, {
            getVectors: { get: () => super.getVectors }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.getVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
    }
    /**
     *
     * @alpha
     *
     * Lists vectors in this index with pagination
     * Convenience method that automatically includes bucket and index names
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param options - Listing options (bucket and index names automatically set)
     * @returns Promise with array of vectors and pagination token
     *
     * @example
     * ```typescript
     * const index = client.bucket('embeddings-prod').index('documents-openai')
     * const { data } = await index.listVectors({
     *   maxResults: 500,
     *   returnMetadata: true
     * })
     * ```
     */
    listVectors() {
        const _super = Object.create(null, {
            listVectors: { get: () => super.listVectors }
        });
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            return _super.listVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
    }
    /**
     *
     * @alpha
     *
     * Queries for similar vectors in this index
     * Convenience method that automatically includes bucket and index names
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param options - Query options (bucket and index names automatically set)
     * @returns Promise with array of similar vectors ordered by distance
     *
     * @example
     * ```typescript
     * const index = client.bucket('embeddings-prod').index('documents-openai')
     * const { data } = await index.queryVectors({
     *   queryVector: { float32: [0.1, 0.2, ...] },
     *   topK: 5,
     *   filter: { category: 'technical' },
     *   returnDistance: true,
     *   returnMetadata: true
     * })
     * ```
     */
    queryVectors(options) {
        const _super = Object.create(null, {
            queryVectors: { get: () => super.queryVectors }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.queryVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
    }
    /**
     *
     * @alpha
     *
     * Deletes vectors by keys from this index
     * Convenience method that automatically includes bucket and index names
     *
     * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
     *
     * @category Vector Buckets
     * @param options - Deletion options (bucket and index names automatically set)
     * @returns Promise with empty response on success or error
     *
     * @example
     * ```typescript
     * const index = client.bucket('embeddings-prod').index('documents-openai')
     * await index.deleteVectors({
     *   keys: ['doc-1', 'doc-2', 'doc-3']
     * })
     * ```
     */
    deleteVectors(options) {
        const _super = Object.create(null, {
            deleteVectors: { get: () => super.deleteVectors }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.deleteVectors.call(this, Object.assign(Object.assign({}, options), { vectorBucketName: this.vectorBucketName, indexName: this.indexName }));
        });
    }
}
//# sourceMappingURL=StorageVectorsClient.js.map