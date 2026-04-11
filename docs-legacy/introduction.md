# Introduction 🚀

**Bring your own MongoDB. Get a production-ready backend in 60 seconds.**

> **your backend — your database — your rules.**

urBackend is a high-performance, open-source **Backend-as-a-Service (BaaS)** designed to eliminate the friction of building and managing server-side infrastructure without the trap of vendor lock-in.

## Why urBackend?

Traditional BaaS platforms lock you into their database and proprietary APIs. urBackend is different. It's built on the principle of **BYOD (Bring Your Own Database)**. You keep your data in your own hosted MongoDB instance, while we provide the professional-grade API layer, Auth, and Storage to make it production-ready instantly.

- 🟢 **Instant NoSQL Database**: Create collections visually and interact with them via a standard REST API.
- 🔐 **Managed Authentication**: Built-in logic for Sign Up, Login, and Profile management with secure JWT tokens.
- 📦 **Cloud Storage**: Seamlessly upload files and images with public CDN links automatically generated.
- 🔌 **Dynamic Schemas**: Define your data structures using a simple visual modeler with Mongoose-powered validation.
- 🛡️ **Advanced Security**: Integrated rate limiting, NoSQL injection protection, and dual-key separation (`pk_live` & `sk_live`).
- ☁️ **BYOD (Bring Your Own Database)**: Connect your own MongoDB or Supabase instance if you need total data control.

## The Problem We Solve

Traditional backend development is slow. You have to set up servers, configure databases, write boilerplate auth logic, and manage deployments.

urBackend provides a **Unified REST API** that abstracts all that complexity away. You focus on your UI and user experience; we handle the pulse of your data.

---

## API Keys: `pk_live` vs `sk_live`

Every project gets two keys with different trust levels.

| Key | Where to use | Default write access |
| :--- | :--- | :--- |
| `pk_live` (publishable) | Frontend / mobile clients | ❌ Reads only — writes blocked unless RLS is enabled |
| `sk_live` (secret) | Server-side only | ✅ Full read/write access |

**Never expose your `sk_live` key in frontend code.** Use `pk_live` for client-side reads, and enable RLS if you need client-side writes.

---

## Row-Level Security (RLS)

RLS allows `pk_live` clients (e.g., a browser app) to write data while ensuring users can only modify their own documents. It also controls read access when enabled.

**RLS is configured per collection** in the Dashboard. Modes:
`public-read` (anyone reads, owner writes) and `private` (owner reads and writes). `owner-write-only` is treated as `public-read` for legacy projects.

### How RLS enforces ownership

When a `pk_live` request arrives for a write operation:

1. The request **must** include `Authorization: Bearer <user_jwt>` — the JWT issued by `/api/userAuth/login`.
2. urBackend extracts the `userId` from the JWT.
3. For **inserts (POST)**: If the document body omits the owner field (e.g., `userId`), it is automatically injected. If it is present but doesn't match the JWT's `userId`, the request is rejected with `403`.
4. For **updates/deletes (PUT/PATCH/DELETE)**: The existing document's owner field is fetched and compared against the JWT's `userId`. Mismatches return `403`.
5. Attempts to change the owner field in a PATCH/PUT body are also rejected (`403 Owner field immutable`).

For reads:
`public-read` allows anyone to read, while `private` requires a valid user token and restricts results to the owner's documents.

### RLS behavior matrix

| Request | Key | Token | Outcome |
| :--- | :--- | :--- | :--- |
| Write, RLS disabled | `pk_live` | Any | ❌ 403 `Write blocked for publishable key` |
| Write, RLS enabled, no token | `pk_live` | Missing | ❌ 401 `Authentication required` |
| Write, RLS enabled, wrong owner | `pk_live` | userId ≠ doc owner | ❌ 403 `RLS owner mismatch` |
| Write, RLS enabled, correct owner | `pk_live` | userId = doc owner | ✅ Allowed |
| Write, RLS enabled, no ownerField in body | `pk_live` | Valid token | ✅ Allowed — userId auto-injected |
| Any write | `sk_live` | Not required | ✅ Allowed — secret key bypasses RLS |

### Example: client-side post creation

```javascript
// Step 1 — login to get a user JWT
const { token } = await fetch('/api/userAuth/login', {
  method: 'POST',
  headers: { 'x-api-key': 'pk_live_...', 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'alice@example.com', password: 'secret' })
}).then(r => r.json());

// Step 2 — create a post; userId is auto-injected from the JWT
await fetch('/api/data/posts', {
  method: 'POST',
  headers: {
    'x-api-key': 'pk_live_...',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ title: 'Hello', content: 'World' })
});
// Saved document: { _id: '...', userId: '<alice id>', title: 'Hello', content: 'World' }
```

### Social Auth setup

Social Auth follows a dashboard-driven setup similar to Supabase:

1. Set the project's `Site URL` in Project Settings.
2. Open `Auth -> Social Auth` in the dashboard.
3. Copy the read-only callback URL shown for GitHub or Google.
4. Register that callback URL in the provider's OAuth app settings.
5. Paste the provider `Client ID` and `Client Secret` back into urBackend and enable the provider.

After successful login, users are redirected to:
`<Site URL>/auth/callback`

The frontend should then:
1. Read `token` from the URL fragment and `rtCode` from the query string.
2. Call `POST /api/userAuth/social/exchange` with `{ token, rtCode }`.
3. Expect the standard response shape `{ success, data, message }`.
4. Store the access token and `data.refreshToken`.
5. Finish the local sign-in flow and redirect into the app.

Example callback request:

```js
const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
const rtCode = new URLSearchParams(window.location.search).get('rtCode');

await fetch('/api/userAuth/social/exchange', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ token, rtCode })
});
```

### Common failure cases

| Error response | Root cause | Fix |
| :--- | :--- | :--- |
| `403 Write blocked for publishable key` | Collection RLS is off | Enable RLS in Dashboard, or use `sk_live` |
| `401 Authentication required` | No `Authorization` header | Add `Authorization: Bearer <jwt>` |
| `403 RLS owner mismatch` | JWT userId ≠ document owner field | Ensure the user is writing their own data |
| `403 Insert denied` (ownerField `_id`) | `_id` is invalid as an insert owner field | Change ownerField to `userId` or similar |
| `403 Owner field immutable` | PATCH/PUT body tries to change owner field | Remove the owner field from the update body |

---

## Authentication

User accounts are managed exclusively through `/api/userAuth/*`. Direct access to `/api/data/users*` is blocked.

```
POST /api/userAuth/signup   — register a new user
POST /api/userAuth/login    — log in; returns { token, user }
GET  /api/userAuth/me       — get current user (requires Bearer token)
```

All auth endpoints require your `pk_live` key in `x-api-key`.

---

## Data API

The base URL for all data operations is `/api/data/:collectionName`.

| Method | Endpoint | Key required | Notes |
| :--- | :--- | :--- | :--- |
| GET | `/api/data/:collection` | `pk_live` or `sk_live` | Returns paginated list |
| GET | `/api/data/:collection/:id` | `pk_live` or `sk_live` | Returns single document |
| POST | `/api/data/:collection` | `sk_live` (or `pk_live` + RLS) | Insert document |
| PUT | `/api/data/:collection/:id` | `sk_live` (or `pk_live` + RLS) | Replace document |
| PATCH | `/api/data/:collection/:id` | `sk_live` (or `pk_live` + RLS) | Partial update |
| DELETE | `/api/data/:collection/:id` | `sk_live` (or `pk_live` + RLS) | Delete document |

Query parameters for GET requests: `page`, `limit`, `sort`, `filter[field][op]=value`.

