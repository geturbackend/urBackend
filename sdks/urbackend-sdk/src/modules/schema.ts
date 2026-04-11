import { UrBackendClient } from '../client';
import { CollectionSchema } from '../types';

export class SchemaModule {
  constructor(private client: UrBackendClient) {}

  /**
   * Fetch the schema definition for a collection
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