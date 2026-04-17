import { UrBackendClient } from '../client';
import { CollectionSchema } from '../types';

/**
 * Module for managing database schemas in urBackend
 * 
 * @class SchemaModule
 * @description Provides methods to fetch and manage collection schema definitions.
 * Schemas define the structure, validation rules, and data types for collections.
 * 
 * @example
 * // Initialize the schema module
 * const client = new UrBackendClient({ secretKey: 'sk_live_xxx' });
 * const schema = new SchemaModule(client);
 * 
 * // Get schema for a collection
 * const collectionSchema = await schema.getSchema('users');
 * console.log(collectionSchema.fields);
 */
export class SchemaModule {
  /**
   * Creates an instance of SchemaModule
   * 
   * @param {UrBackendClient} client - The authenticated urBackend client instance
   * 
   * @example
   * const client = new UrBackendClient({ secretKey: 'sk_live_xxx' });
   * const schema = new SchemaModule(client);
   */
  constructor(private client: UrBackendClient) {}

  /**
   * Fetches the schema definition for a specific collection
   * 
   * @param {string} collection - Name of the collection to fetch schema for
   * @returns {Promise<CollectionSchema>} Promise resolving to the collection schema definition
   * 
   * @throws {Error} If collection name is empty or contains only whitespace
   * @throws {Error} If collection does not exist
   * @throws {Error} If authentication fails
   * 
   * @example
   * // Get schema for users collection
   * const userSchema = await schema.getSchema('users');
   * console.log(userSchema.fields);
   * 
   * @example
   * // Get schema for products collection with error handling
   * try {
   *   const productSchema = await schema.getSchema('products');
   *   console.log('Schema fields:', Object.keys(productSchema.fields));
   * } catch (error) {
   *   console.error('Failed to fetch schema:', error.message);
   * }
   * 
   * @example
   * // Validate collection name before fetching
   * const collectionName = 'my_collection';
   * if (collectionName.trim()) {
   *   const schemaDef = await schema.getSchema(collectionName);
   *   // Use schema definition
   * }
   */
  public async getSchema(collection: string): Promise<CollectionSchema> {
    const trimmedCollection = collection.trim();
    if (trimmedCollection === '') {
      throw new Error('Collection name cannot be empty or whitespace-only');
    }

    const encodedCollection = encodeURIComponent(trimmedCollection);
    const response = await this.client.request<{
      message: string;
      collection: CollectionSchema;
    }>('GET', `/api/schemas/${encodedCollection}`);

    return response.collection;
  }
}