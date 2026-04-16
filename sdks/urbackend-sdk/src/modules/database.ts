import { UrBackendClient } from '../client';
import { DocumentData, InsertPayload, UpdatePayload, PatchPayload, QueryParams } from '../types';
import { NotFoundError } from '../errors';

export class DatabaseModule {
  constructor(private client: UrBackendClient) {}

  /**
   * Fetch all documents from a collection with optional query parameters
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
 * Count documents in a collection with optional filters
 */
public async count(collection: string, params: Omit<QueryParams, 'count'> = {}): Promise<number> {
  const queryString = this.buildQueryString({ ...params, count: 'true' });
  const path = `/api/data/${collection}${queryString}`;
  const result = await this.client.request<{ count: number }>('GET', path);
  return result.count;
}

  /**
   * Fetch a single document by its ID
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
   * Insert a new document into a collection
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
   * Update an existing document by its ID (Full replacement)
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
   * Partially update an existing document by its ID
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
   * Delete a document by its ID
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
