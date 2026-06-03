export class UrBackendError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public endpoint: string,
  ) {
    super(message);
    this.name = 'UrBackendError';
  }
}

export class AuthError extends UrBackendError {
  constructor(message: string, statusCode: number, endpoint: string) {
    super(message, statusCode, endpoint);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends UrBackendError {
  constructor(message: string, endpoint: string) {
    super(message, 404, endpoint);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends UrBackendError {
  public retryAfter?: number;

  constructor(message: string, endpoint: string, retryAfter?: number) {
    super(message, 429, endpoint);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class StorageError extends UrBackendError {
  constructor(message: string, statusCode: number, endpoint: string) {
    super(message, statusCode, endpoint);
    this.name = 'StorageError';
  }
}

export class ValidationError extends UrBackendError {
  constructor(message: string, endpoint: string) {
    super(message, 400, endpoint);
    this.name = 'ValidationError';
  }
}

export async function parseApiError(response: Response): Promise<UrBackendError> {
  const endpoint = new URL(response.url).pathname;
  let message = 'An unexpected error occurred';
  let data: unknown;

  try {
    data = await response.json();
    if (typeof data === 'object' && data !== null) {
      const errData = data as Record<string, unknown>;
      if ('error' in errData) {
        let candidate = '';
        if (typeof errData.error === 'string') {
          candidate = errData.error;
        } else if (Array.isArray(errData.error) && errData.error.length > 0) {
          candidate = errData.error.map((e: unknown) => {
            if (typeof e === 'object' && e !== null && 'message' in e) {
              return String((e as Record<string, unknown>).message);
            }
            return String(e);
          }).join(', ');
        } else {
          candidate = JSON.stringify(errData.error);
        }
        
        if (candidate && candidate.trim().length > 0 && candidate !== '[]' && candidate !== 'null') {
          message = candidate;
        } else if ('message' in errData) {
          message = typeof errData.message === 'string' ? errData.message : JSON.stringify(errData.message);
        }
      } else if ('message' in errData) {
        if (typeof errData.message === 'string') {
          message = errData.message;
        } else {
          message = JSON.stringify(errData.message);
        }
      }
    }
  } catch {
    // If not JSON, use status text
    message = response.statusText || message;
  }

  const status = response.status;

  if (status === 401 || status === 403) {
    return new AuthError(message, status, endpoint);
  }

  if (status === 404) {
    return new NotFoundError(message, endpoint);
  }

  if (status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    return new RateLimitError(message, endpoint, retryAfter ? parseInt(retryAfter, 10) : undefined);
  }

  if (status === 400) {
    return new ValidationError(message, endpoint);
  }

  // Default for 5xx or other 4xx
  if (endpoint.includes('/api/storage')) {
    return new StorageError(message, status, endpoint);
  }

  return new UrBackendError(message, status, endpoint);
}
