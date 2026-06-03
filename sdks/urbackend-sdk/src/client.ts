import { UrBackendConfig, RequestOptions } from './types';
import { UrBackendError, parseApiError } from './errors';
import { AuthModule } from './modules/auth';
import { DatabaseModule } from './modules/database';
import { StorageModule } from './modules/storage';
import { SchemaModule } from './modules/schema';
import { MailModule } from './modules/mail';

export class UrBackendClient {
  private apiKey: string;
  private baseUrl: string;
  private _auth?: AuthModule;
  private _db?: DatabaseModule;
  private _storage?: StorageModule;
  private _schema?: SchemaModule;
  private _mail?: MailModule;
  private headers: Record<string, string>;

  constructor(config: UrBackendConfig) {
    if (!config.apiKey) {
      throw new Error('urbackend-sdk: apiKey is required to initialize the client.');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.ub.bitbros.in';
    this.headers = config.headers || {};

    if (typeof window !== 'undefined' && this.apiKey.startsWith('sk_live_')) {
      console.warn(
        '⚠️ urbackend-sdk: Avoid exposing your Secret Key (sk_live_...) in client-side code. This can lead to unauthorized access to your account and data. Use your Publishable Key (pk_live_...) instead.',
      );
    }
  }

  get auth(): AuthModule {
    if (!this._auth) {
      this._auth = new AuthModule(this);
    }
    return this._auth;
  }

  get db(): DatabaseModule {
    if (!this._db) {
      this._db = new DatabaseModule(this);
    }
    return this._db;
  }

  get storage(): StorageModule {
    if (!this._storage) {
      this._storage = new StorageModule(this);
    }
    return this._storage;
  }

  get schema(): SchemaModule {
    if (!this._schema) {
      this._schema = new SchemaModule(this);
    }
    return this._schema;
  }

  get mail(): MailModule {
    if (!this._mail) {
      this._mail = new MailModule(this);
    }
    return this._mail;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Internal request handler
   */
  public async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      'User-Agent': `urbackend-sdk-js/0.4.2`,
      ...this.headers,
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    // Merge custom headers from options if provided
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    let requestBody: BodyInit | undefined;

    if (options.isMultipart) {
      // Fetch handles FormData content type and boundary
      requestBody = options.body as FormData;
    } else if (options.body) {
      headers['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: requestBody,
        credentials: options.credentials,
      });

      if (!response.ok) {
        throw await parseApiError(response);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        // The API returns { data, success, message }
        // If data is present, return it. If success/message are present but no data, return the whole object (for exchange/logout etc)
        if (json.data !== undefined) {
          return json.data;
        }
        return json;
      }

      return (await response.text()) as unknown as T;
    } catch (error) {
      if (error instanceof UrBackendError) {
        throw error;
      }
      throw new UrBackendError(
        error instanceof Error ? error.message : 'Network request failed',
        0,
        path,
      );
    }
  }
}
