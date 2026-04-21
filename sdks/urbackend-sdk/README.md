# urbackend-sdk

Official TypeScript SDK for [urBackend](https://urbackend.bitbros.in) — the instant Backend-as-a-Service for MongoDB.

## Installation
```bash
npm install @urbackend/sdk
```

## Quick Start
```javascript
import urBackend from '@urbackend/sdk';

const client = urBackend({ apiKey: 'YOUR_API_KEY' });

// Auth
const { accessToken } = await client.auth.login({ email, password });
const user = await client.auth.me();

// Database — collections are managed via the urBackend Dashboard
await client.db.insert('posts', { title: 'Hello World' }, client.auth.getToken());
await client.db.getAll('posts', { sort: 'createdAt:desc', limit: 10 });

// Storage
const { url } = await client.storage.upload(file);

// Mail (Requires Secret Key)
await client.mail.send({
  to: 'user@example.com',
  templateName: 'welcome', // or 'welcome-2', 'otp', 'password-reset', 'invite'
  variables: { name: 'Yash', projectName: 'Acme', appUrl: 'https://acme.com' },
});
```

## API Reference

### Client Initialization
`urBackend({ apiKey: string, baseUrl?: string })`

---

### Auth (`client.auth`)
| Method | Params | Returns |
|--------|--------|---------|
| `signUp` | `{ email, password, username?, name?, ... }` | `AuthUser` |
| `login` | `{ email, password }` | `AuthResponse` |
| `me` | `token?` | `AuthUser` |
| `logout` | `token?` | `{ success: boolean }` |
| `refreshToken` | `refreshToken?` | `AuthResponse` |
| `updateProfile`| `payload, token?` | `{ message: string }` |
| `changePassword`| `payload, token?` | `{ message: string }` |
| `verifyEmail` | `{ email, otp }` | `{ message: string }` |
| `publicProfile`| `username` | `AuthUser` |
| `socialStart` | `provider ('github'\|'google')` | `string` (Redirect URL) |
| `socialExchange`| `{ token, rtCode }` | `SocialExchangeResponse` |

---

### Database (`client.db`)
Support for **Row-Level Security (RLS)** is built-in. Pass the user's `accessToken` as the final parameter to write routes if RLS is enabled for the collection.

| Method | Params | Returns |
|--------|--------|---------|
| `getAll<T>` | `collection, params?` | `T[]` |
| `getOne<T>` | `collection, id, options?` | `T` |
| `insert<T>` | `collection, data, token?` | `T` |
| `update<T>` | `collection, id, data, token?` | `T` (Full Replace) |
| `patch<T>` | `collection, id, data, token?` | `T` (Partial Update) |
| `delete` | `collection, id, token?` | `{ deleted: boolean }` |

**Query Parameters (`params`):**
- `filter`: `{ price_gt: 100 }`
- `sort`: `"createdAt:desc"`
- `limit`: `50`
- `page`: `1`
- `populate`: `"author"` (Expand Reference fields)

---

### Storage (`client.storage`)
| Method | Params | Returns |
|--------|--------|---------|
| `upload` | `file (Buffer\|Blob), filename?` | `{ url, path, provider }` |
| `deleteFile` | `path` | `{ deleted: boolean }` |

---

### New Modules
- **`client.schema`**: Use `getSchema(collection)` to fetch visual field definitions.
- **`client.mail`**: Use `send(payload)` to send emails via Resend (Requires Secret Key).

## Error Handling
```javascript
import { AuthError, NotFoundError, RateLimitError } from '@urbackend/sdk';

try {
  await client.db.getOne('products', id);
} catch (e) {
  if (e instanceof AuthError) console.error('Invalid token or insufficient RLS permissions');
  if (e instanceof NotFoundError) console.error('Resource not found');
  if (e instanceof RateLimitError) console.error('Too many requests');
}
```

## Security
- **Never expose your Secret Key (`sk_live_...`)** in frontend/browser code.
- Use **Publishable Keys (`pk_live_...`)** for client-side applications.
- Enable **RLS** in the urBackend Dashboard to allow secure writes from the frontend using the user's access token.
