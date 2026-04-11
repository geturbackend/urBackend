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

## 7. Social Auth (GitHub / Google)

Social auth lets your users sign in using their GitHub or Google accounts instead of email/password.

### Overview: How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Your App   │────▶│  urBackend  │────▶│  Provider   │────▶│  urBackend  │
│  (Frontend) │     │  /start     │     │  (GitHub/   │     │  /callback  │
│             │     │             │     │   Google)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                    ┌─────────────┐     ┌─────────────┐            │
                    │  Your App   │◀────│  urBackend  │◀───────────┘
                    │  /auth/     │     │  redirects  │
                    │  callback   │     │  with tokens│
                    └─────────────┘     └─────────────┘
```

---

### Step 0: Dashboard Setup (One-time)

Before your frontend can use social auth:

1. **Set Site URL** → Go to `Project Settings` → Add your frontend URL (e.g., `https://myapp.com`)
2. **Configure Provider** → Go to `Auth` → `Social Auth` → Select GitHub or Google
3. **Copy Callback URL** → urBackend shows a read-only callback URL like:
   ```
   https://api.ub.bitbros.in/api/userAuth/social/github/callback
   ```
4. **Register in Provider Console**:
   - GitHub: `Settings → Developer settings → OAuth Apps → New OAuth App`
   - Google: `Google Cloud Console → APIs & Services → Credentials → Create OAuth Client`
   - Paste the callback URL from Step 3
5. **Save Credentials** → Copy `Client ID` and `Client Secret` from provider → Paste in urBackend dashboard → Enable

---

### Step 1: Create a Callback Page in Your Frontend

> ⚠️ **You MUST create this page!** urBackend will redirect users here after OAuth.

Create a page at `/auth/callback` in your frontend app. This page will:
1. Extract tokens from the URL
2. Exchange `rtCode` for refresh token
3. Store tokens and redirect user to dashboard

**React Example (`/auth/callback`):**

```jsx
// pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      // Step 2a: Check for errors
      const queryParams = new URLSearchParams(window.location.search);
      const error = queryParams.get('error');
      
      if (error) {
        alert('Login failed: ' + error);
        navigate('/login');
        return;
      }

      // Step 2b: Extract tokens from URL
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get('token');
      const rtCode = queryParams.get('rtCode');

      if (!accessToken || !rtCode) {
        alert('Missing tokens');
        navigate('/login');
        return;
      }

      // Step 3: Exchange rtCode for refresh token
      const response = await fetch('https://api.ub.bitbros.in/api/userAuth/social/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'pk_live_YOUR_KEY'
        },
        body: JSON.stringify({ token: accessToken, rtCode })
      });

      const data = await response.json();

      if (!data.success) {
        alert('Token exchange failed');
        navigate('/login');
        return;
      }

      // Step 4: Store tokens and redirect
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);

      // Optional: store extra info
      localStorage.setItem('provider', queryParams.get('provider'));
      localStorage.setItem('userId', queryParams.get('userId'));

      navigate('/dashboard');
    }

    handleCallback();
  }, [navigate]);

  return <div>Completing login...</div>;
}

export default AuthCallback;
```

---

### Step 2: Add Login Button in Your Frontend

When user clicks "Login with GitHub" or "Login with Google", redirect them to urBackend's start endpoint:

```jsx
// components/LoginButtons.jsx
const API_KEY = 'pk_live_YOUR_KEY';
const API_URL = 'https://api.ub.bitbros.in';

function LoginButtons() {
  const handleGitHubLogin = () => {
    // Redirect browser to urBackend, which redirects to GitHub
    window.location.href = `${API_URL}/api/userAuth/social/github/start?x-api-key=${API_KEY}`;
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/userAuth/social/google/start?x-api-key=${API_KEY}`;
  };

  return (
    <div>
      <button onClick={handleGitHubLogin}>Login with GitHub</button>
      <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  );
}
```

> **Note:** You can also pass `x-api-key` as a header, but since this is a redirect (not fetch), query param is easier.

---

### Complete Flow Summary

| Step | What Happens | Who Does It |
|------|--------------|-------------|
| 1 | User clicks "Login with GitHub" | Your frontend |
| 2 | Browser redirects to `/api/userAuth/social/github/start` | Your frontend |
| 3 | urBackend redirects to GitHub login page | urBackend |
| 4 | User logs in on GitHub | User |
| 5 | GitHub redirects to urBackend callback | GitHub |
| 6 | urBackend creates/links user, generates tokens | urBackend |
| 7 | urBackend redirects to `<your-site>/auth/callback?rtCode=...#token=...` | urBackend |
| 8 | Your callback page extracts `token` and `rtCode` | Your frontend |
| 9 | Your callback page calls `/social/exchange` with both | Your frontend |
| 10 | urBackend returns `refreshToken` | urBackend |
| 11 | Your app stores tokens, redirects to dashboard | Your frontend |

---

### API Reference

#### Start OAuth Flow

**Endpoint:** `GET /api/userAuth/social/:provider/start`

| Param | Value |
|-------|-------|
| `:provider` | `github` or `google` |
| `x-api-key` | Your publishable key (query param or header) |

**Response:** Browser redirect to provider login page

---

#### Exchange rtCode for Refresh Token

**Endpoint:** `POST /api/userAuth/social/exchange`

**Headers:**
```
Content-Type: application/json
x-api-key: pk_live_YOUR_KEY
```

**Body:**
```json
{
  "token": "eyJ... (access token from URL fragment)",
  "rtCode": "abc123 (one-time code from query string)"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "refreshToken": "REFRESH_TOKEN_VALUE"
  },
  "message": "Refresh token exchanged successfully"
}
```

**Error Responses:**
```json
{ "success": false, "message": "rtCode and token are required" }
{ "success": false, "message": "Invalid or expired refresh token exchange code" }
```

---

### What Gets Passed to Your Callback URL

After successful login, urBackend redirects to:

```
https://your-site.com/auth/callback?rtCode=abc&provider=github&projectId=p1&userId=u1&isNewUser=false&linkedByEmail=true#token=eyJ...
```

| Param | Location | Description |
|-------|----------|-------------|
| `token` | URL fragment (`#`) | Access token (JWT) - use for API calls |
| `rtCode` | Query string | One-time code to exchange for refresh token |
| `provider` | Query string | `github` or `google` |
| `projectId` | Query string | Your urBackend project ID |
| `userId` | Query string | The user's ID in your database |
| `isNewUser` | Query string | `true` if account was just created |
| `linkedByEmail` | Query string | `true` if existing account was linked |
| `error` | Query string | Error message (only on failure) |

> **Why is `token` in the fragment?** Fragments (`#...`) are never sent to servers in HTTP requests, preventing token leakage through referrer headers or server logs.

---

### Important Notes

1. **rtCode expires in 60 seconds** - Exchange it immediately
2. **rtCode is one-time use** - Cannot be reused
3. **Account linking** - If a user with the same verified email exists, accounts are automatically linked
4. **New users** - A hashed password is auto-generated internally (users can still set a real password later)

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
