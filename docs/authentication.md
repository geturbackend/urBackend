# Authentication 🔐

urBackend includes a built-in authentication system that manages user registration, login, token refresh, logout, and profile retrieval using **JSON Web Tokens (JWT)**.

## The `users` Collection Contract

To enable authentication, your project must have a collection named `users`. 

> [!IMPORTANT]
> **Schema Requirements**:
> The `users` collection **MUST** contain at least these two fields:
> 1. `email` (String, Required, Unique)
> 2. `password` (String, Required)
>
> You can add any other fields (e.g., `username`, `avatar`, `preferences`), and urBackend's Mongoose-powered validation will handle them automatically during signup.

## 1. Sign Up User

Creates a new user and returns a 7-day JWT token.

**Endpoint**: `POST /api/userAuth/signup`

```javascript
await fetch('https://api.ub.bitbros.in/api/userAuth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_KEY' },
  body: JSON.stringify({
    email: "dev@example.com",
    password: "securePassword123",
    username: "dev_pulse",
    preferences: { theme: "dark", notifications: true } // Custom fields are supported!
  })
});
```

## 2. Login User

Authenticates credentials and returns an access token. A refresh token is also issued for session continuation.

**Endpoint**: `POST /api/userAuth/login`

```javascript
const res = await fetch('https://api.ub.bitbros.in/api/userAuth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_KEY' },
  body: JSON.stringify({
    email: "dev@example.com",
    password: "securePassword123"
  })
});
const { accessToken, expiresIn } = await res.json();
```

> [!NOTE]
> `token` is currently returned as a backward-compatibility alias of `accessToken` and will be removed in a future release.
> Please migrate clients to `accessToken` now.

## 3. Refresh Access Token

Use when access token expires.

**Endpoint**: `POST /api/userAuth/refresh-token`

Web clients can use refresh cookie automatically:

```javascript
const refreshed = await fetch('https://api.ub.bitbros.in/api/userAuth/refresh-token', {
  method: 'POST',
  headers: { 'x-api-key': 'YOUR_KEY' },
  credentials: 'include'
});
```

Mobile/non-browser clients can send refresh token in header:

```javascript
const refreshed = await fetch('https://api.ub.bitbros.in/api/userAuth/refresh-token', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_KEY',
    'x-refresh-token': REFRESH_TOKEN,
    'x-refresh-token-mode': 'header'
  }
});
```

## 4. Logout

Revokes the current refresh session.

**Endpoint**: `POST /api/userAuth/logout`

```javascript
await fetch('https://api.ub.bitbros.in/api/userAuth/logout', {
  method: 'POST',
  headers: { 'x-api-key': 'YOUR_KEY' },
  credentials: 'include'
});
```

## 5. Get Profile (Me)

Fetches the details of the currently authenticated user.

**Endpoint**: `GET /api/userAuth/me`

```javascript
await fetch('https://api.ub.bitbros.in/api/userAuth/me', {
  headers: {
    'x-api-key': 'YOUR_KEY',
    'Authorization': `Bearer ${USER_TOKEN}`
  }
});
```

## 6. Get Public Profile by Username

Fetches a safe, public profile view for a user without requiring login.

**Endpoint**: `GET /api/userAuth/public/:username`

```javascript
await fetch('https://api.ub.bitbros.in/api/userAuth/public/dev_pulse', {
  headers: { 'x-api-key': 'YOUR_KEY' }
});
```

> [!NOTE]
> This endpoint never returns sensitive fields like `password` or `email`.

## Security Note

- **Access Token Expiration**: Access tokens are short-lived. Use `/api/userAuth/refresh-token` for renewal.
- **Refresh Token Rotation**: Refresh tokens are rotated and replay-protected.
- **Passwords**: Passwords are automatically hashed using **Bcrypt** before being stored. Even project owners cannot see raw user passwords.

## How this relates to RLS and `pk_live`

- `userAuth` endpoints (`/api/userAuth/*`) are the official way to create/login/manage end users.
- The generic data API for users (`/api/data/users*`) is protected and should not be used for user management.
- With `pk_live`, write access to non-users collections is:
  - blocked by default,
  - allowed only when collection-level RLS is enabled,
  - and requires `Authorization: Bearer <user_jwt>`.

## RLS Quick Test (2 minutes)

Use this checklist to quickly verify collection-level RLS behavior on any non-`users` collection (example: `posts` with owner field `userId`).

### 1) `pk_live` + no token => write should fail

```bash
curl -X POST "https://api.ub.bitbros.in/api/data/posts" ^
  -H "Content-Type: application/json" ^
  -H "x-api-key: pk_live_xxx" ^
  -d "{\"content\":\"hello\"}"
```

Expected: `401/403` when RLS write auth is required.

### 2) `pk_live` + user token + no `userId` => write should pass, owner auto-injected

```bash
curl -X POST "https://api.ub.bitbros.in/api/data/posts" ^
  -H "Content-Type: application/json" ^
  -H "x-api-key: pk_live_xxx" ^
  -H "Authorization: Bearer USER_JWT" ^
  -d "{\"content\":\"my first post\"}"
```

Expected: success (`200/201`) and response includes `userId` set to the authenticated user.

### 3) `pk_live` + user token + different `userId` => write should fail

```bash
curl -X POST "https://api.ub.bitbros.in/api/data/posts" ^
  -H "Content-Type: application/json" ^
  -H "x-api-key: pk_live_xxx" ^
  -H "Authorization: Bearer USER_JWT" ^
  -d "{\"content\":\"blocked write\",\"userId\":\"SOMEONE_ELSE_ID\"}"
```

Expected: `403 Forbidden`.

### 4) `sk_live` (server side) => bypass allowed

```bash
curl -X POST "https://api.ub.bitbros.in/api/data/posts" ^
  -H "Content-Type: application/json" ^
  -H "x-api-key: sk_live_xxx" ^
  -d "{\"content\":\"server insert\",\"userId\":\"any_valid_user_id\"}"
```

Expected: success (`200/201`) from trusted backend context.
