import { UrBackendClient } from '../client';
import { DocumentData, InsertPayload, UpdatePayload, PatchPayload, QueryParams } from '../types';
import { NotFoundError } from '../errors';

/**
 * Module for database operations in urBackend
 * 
 * @class DatabaseModule
 * @description Provides CRUD (Create, Read, Update, Delete) operations for collections.
 * Supports filtering, pagination, sorting, population, and expansion of related data.
 * 
 * @example
 * // Initialize the database module
 * const client = new UrBackendClient({ secretKey: 'sk_live_xxx' });
 * const db = new DatabaseModule(client);
 * 
 * // Get all users
 * const users = await db.getAll('users');
 * console.log(users);
 * 
 * @example
 * // Insert a new document
 * const newUser = await db.insert('users', {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * console.log('Created:', newUser._id);
 */
export class DatabaseModule {
  /**
   * Creates an instance of DatabaseModule
   * 
   * @param {UrBackendClient} client - The authenticated urBackend client instance
   * 
   * @example
   * const client = new UrBackendClient({ secretKey: 'sk_live_xxx' });
   * const db = new DatabaseModule(client);
   */
  constructor(private client: UrBackendClient) {}

  /**
   * Fetches all documents from a collection with optional query parameters
   * 
   * @template T - The document type (extends DocumentData)
   * @param {string} collection - Name of the collection to query
   * @param {QueryParams} [params={}] - Optional query parameters for filtering, sorting, pagination
   * @returns {Promise<T[]>} Promise resolving to an array of documents (empty array if none found)
   * 
   * @throws {Error} If collection name is invalid
   * @throws {Error} If authentication fails
   * @throws {Error} If query parameters are malformed
   * 
   * @example
   * // Get all users
   * const users = await db.getAll('users');
   * 
   * @example
   * // Get users with filters and pagination
   * const activeUsers = await db.getAll('users', {
   *   filter: { status: 'active' },
   *   limit: 10,
   *   skip: 0,
   *   sort: '-createdAt'
   * });
   * 
   * @example
   * // Get users with populated relations
   * const usersWithPosts = await db.getAll('users', {
   *   populate: ['posts'],
   *   expand: ['profile']
   * });
   */
  public async getAll<T extends DocumentData>(collection: string, params: QueryParams = {}): Promise<T[]> {
    const queryString = this.buildQueryString(params);
    const path = `/api/data/${collection}${queryString}`;
    
    try {
      return await this.client.request<T[]>('GET', path);
    } catch (e) {
      if (e instanceof NotFoundError) {
        return [] as T[];
      }
      throw e;
    }
  }

  /**
   * Counts documents in a collection with optional filters
   * 
   * @param {string} collection - Name of the collection to count
   * @param {Omit<QueryParams, 'count'>} [params={}] - Optional filter parameters
   * @returns {Promise<number>} Promise resolving to the total count of matching documents
   * 
   * @throws {Error} If collection name is invalid
   * @throws {Error} If authentication fails
   * 
   * @example
   * // Count all users
   * const totalUsers = await db.count('users');
   * console.log(`Total users: ${totalUsers}`);
   * 
   * @example
   * // Count users with filter
   * const activeUsers = await db.count('users', {
   *   filter: { status: 'active' }
   * });
   * 
   * @example
   * // Count for pagination
   * const total = await db.count('products', {
   *   filter: { category: 'electronics' }
   * });
   * const totalPages = Math.ceil(total / 10);
   */
  public async count(collection: string, params: Omit<QueryParams, 'count'> = {}): Promise<number> {
    const queryString = this.buildQueryString({ ...params, count: 'true' });
    const path = `/api/data/${collection}${queryString}`;
    const result = await this.client.request<{ count: number }>('GET', path);
    return result.count;
  }

  /**
   * Fetches a single document by its ID
   * 
   * @template T - The document type (extends DocumentData)
   * @param {string} collection - Name of the collection
   * @param {string} id - Unique identifier of the document
   * @param {Object} [options={}] - Optional parameters
   * @param {string|string[]} [options.populate] - Fields to populate with related data
   * @param {string|string[]} [options.expand] - Fields to expand with nested data
   * @returns {Promise<T>} Promise resolving to the document
   * 
   * @throws {NotFoundError} If document with given ID does not exist
   * @throws {Error} If collection name or ID is invalid
   * @throws {Error} If authentication fails
   * 
   * @example
   * // Get user by ID
   * const user = await db.getOne('users', 'user_123');
   * console.log(user.name);
   * 
   * @example
   * // Get user with populated posts
   * const userWithPosts = await db.getOne('users', 'user_123', {
   *   populate: ['posts', 'comments']
   * });
   * 
   * @example
   * // Get with error handling
   * try {
   *   const user = await db.getOne('users', 'non_existent_id');
   * } catch (error) {
   *   if (error instanceof NotFoundError) {
   *     console.log('User not found');
   *   }
   * }
   */
  public async getOne<T extends DocumentData>(
    collection: string, 
    id: string, 
    options: { populate?: string | string[]; expand?: string | string[] } = {}
  ): Promise<T> {
    const queryString = this.buildQueryString(options);
    return this.client.request<T>('GET', `/api/data/${collection}/${id}${queryString}`);
  }

  /**
   * Inserts a new document into a collection
   * 
   * @template T - The document type (extends DocumentData)
   * @param {string} collection - Name of the collection
   * @param {InsertPayload} data - Document data to insert
   * @param {string} [token] - Optional authentication token (overrides client default)
   * @returns {Promise<T>} Promise resolving to the created document with generated ID
   * 
   * @throws {Error} If collection name is invalid
   * @throws {Error} If data validation fails
   * @throws {Error} If authentication fails
   * @throws {Error} If unique constraint violation occurs
   * 
   * @example
   * // Insert a new user
   * const newUser = await db.insert('users', {
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   age: 25
   * });
   * console.log('User created:', newUser._id);
   * 
   * @example
   * // Insert with custom token
   * const result = await db.insert('posts', {
   *   title: 'My Post',
   *   content: 'Hello World'
   * }, customAuthToken);
   * 
   * @example
   * // Insert with error handling
   * try {
   *   const user = await db.insert('users', { email: 'existing@email.com' });
   * } catch (error) {
   *   if (error.message.includes('duplicate')) {
   *     console.log('Email already exists');
   *   }
   * }
   */
  public async insert<T extends DocumentData>(
    collection: string, 
    data: InsertPayload, 
    token?: string
  ): Promise<T> {
    return this.client.request<T>('POST', `/api/data/${collection}`, { 
      body: data,
      token 
    });
  }

  /**
   * Updates an existing document by its ID (full replacement)
   * 
   * @template T - The document type (extends DocumentData)
   * @param {string} collection - Name of the collection
   * @param {string} id - Unique identifier of the document
   * @param {UpdatePayload} data - Complete document data for replacement
   * @param {string} [token] - Optional authentication token (overrides client default)
   * @returns {Promise<T>} Promise resolving to the updated document
   * 
   * @throws {NotFoundError} If document with given ID does not exist
   * @throws {Error} If collection name or ID is invalid
   * @throws {Error} If data validation fails
   * @throws {Error} If authentication fails
   * 
   * @example
   * // Full update of a user
   * const updatedUser = await db.update('users', 'user_123', {
   *   name: 'Jane Doe',
   *   email: 'jane@example.com',
   *   age: 26
   * });
   * 
   * @example
   * // Update with error handling
   * try {
   *   const result = await db.update('users', 'user_123', updatedData);
   *   console.log('Update successful:', result);
   * } catch (error) {
   *   if (error instanceof NotFoundError) {
   *     console.log('User not found');
   *   }
   * }
   */
  public async update<T extends DocumentData>(
    collection: string,
    id: string,
    data: UpdatePayload,
    token?: string
  ): Promise<T> {
    return this.client.request<T>('PUT', `/api/data/${collection}/${id}`, { 
      body: data,
      token
    });
  }

  /**
   * Partially updates an existing document by its ID (only provided fields)
   * 
   * @template T - The document type (extends DocumentData)
   * @param {string} collection - Name of the collection
   * @param {string} id - Unique identifier of the document
   * @param {PatchPayload} data - Partial data to update
   * @param {string} [token] - Optional authentication token (overrides client default)
   * @returns {Promise<T>} Promise resolving to the updated document
   * 
   * @throws {NotFoundError} If document with given ID does not exist
   * @throws {Error} If collection name or ID is invalid
   * @throws {Error} If data validation fails
   * @throws {Error} If authentication fails
   * 
   * @example
   * // Partial update - only update age
   * const updatedUser = await db.patch('users', 'user_123', {
   *   age: 26
   * });
   * 
   * @example
   * // Add a new field to document
   * const result = await db.patch('users', 'user_123', {
   *   lastLogin: new Date().toISOString()
   * });
   * 
   * @example
   * // Partial update with error handling
   * try {
   *   const result = await db.patch('products', 'prod_123', {
   *     price: 29.99
   *   });
   *   console.log('Price updated:', result);
   * } catch (error) {
   *   console.error('Update failed:', error.message);
   * }
   */
  public async patch<T extends DocumentData>(
    collection: string,
    id: string,
    data: PatchPayload,
    token?: string
  ): Promise<T> {
    return this.client.request<T>('PATCH', `/api/data/${collection}/${id}`, { 
      body: data,
      token
    });
  }

  /**
   * Deletes a document by its ID
   * 
   * @param {string} collection - Name of the collection
   * @param {string} id - Unique identifier of the document to delete
   * @param {string} [token] - Optional authentication token (overrides client default)
   * @returns {Promise<{ deleted: boolean }>} Promise resolving to deletion status
   * 
   * @throws {Error} If collection name or ID is invalid
   * @throws {Error} If authentication fails
   * @throws {Error} If user lacks permission to delete
   * 
   * @example
   * // Delete a user
   * const result = await db.delete('users', 'user_123');
   * if (result.deleted) {
   *   console.log('User deleted successfully');
   * }
   * 
   * @example
   * // Delete with error handling
   * try {
   *   const { deleted } = await db.delete('posts', 'post_456');
   *   if (deleted) {
   *     console.log('Post removed');
   *   }
   * } catch (error) {
   *   console.error('Deletion failed:', error.message);
   * }
   * 
   * @example
   * // Delete after checking existence
   * const exists = await db.getOne('users', 'user_123').catch(() => null);
   * if (exists) {
   *   await db.delete('users', 'user_123');
   *   console.log('User deleted');
   * }
   */
  public async delete(collection: string, id: string, token?: string): Promise<{ deleted: boolean }> {
    const result = await this.client.request<{ message?: string; id?: string } | null>(
      'DELETE',
      `/api/data/${collection}/${id}`,
      { token },
    );

    const deleted =
      typeof result === 'object' &&
      result !== null &&
      (result.id === id || result.message === 'Document deleted');

    return { deleted };
  }

  /**
   * Internal helper to build query string from QueryParams
   * 
   * @param {QueryParams} params - Query parameters to convert
   * @returns {string} URL query string (starting with '?' if parameters exist, otherwise empty)
   * 
   * @internal
   * @private
   * 
   * @example
   * // Returns "?limit=10&sort=-createdAt"
   * buildQueryString({ limit: 10, sort: '-createdAt' })
   * 
   * @example
   * // Returns "?status=active&age=25"
   * buildQueryString({ filter: { status: 'active', age: 25 } })
   */
  private buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === 'filter' && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([fKey, fValue]) => {
          if (fValue !== undefined && fValue !== null) {
            searchParams.append(fKey, String(fValue));
          }
        });
      } else if ((key === 'populate' || key === 'expand') && Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, String(value));
      }
    });

    const str = searchParams.toString();
    return str ? `?${str}` : '';
  }
}