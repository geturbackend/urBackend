# API Quick Reference 📑

| Area | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/userAuth/signup` | Register a new user |
| **Auth** | `POST` | `/api/userAuth/login` | Log in and get JWT |
| **Auth** | `POST` | `/api/userAuth/refresh-token` | Rotate refresh token and issue new access token |
| **Auth** | `POST` | `/api/userAuth/logout` | Revoke current refresh session |
| **Auth** | `GET` | `/api/userAuth/me` | Get current user profile |
| **Auth** | `GET` | `/api/userAuth/public/:username` | Get public-safe profile by username |
| **Auth** | `POST` | `/api/userAuth/verify-email` | Verify user email with OTP |
| **Auth** | `POST` | `/api/userAuth/request-password-reset` | Request password reset OTP |
| **Auth** | `POST` | `/api/userAuth/reset-password` | Reset user password with OTP |
| **Auth** | `PUT` | `/api/userAuth/update-profile` | Update current user profile |
| **Auth** | `PUT` | `/api/userAuth/change-password` | Change current user password |
| **Data** | `GET` | `/api/data/:collectionName` | Get all documents in collection |
| **Data** | `GET` | `/api/data/:collectionName/:id` | Get document by ID |
| **Data** | `POST` | `/api/data/:collectionName` | Insert new document |
| **Data** | `PUT` | `/api/data/:collectionName/:id` | Update document by ID |
| **Data** | `PATCH` | `/api/data/:collectionName/:id` | Partially update document by ID |
| **Data** | `DELETE` | `/api/data/:collectionName/:id` | Delete document by ID |
| **Storage** | `POST` | `/api/storage/upload` | Upload a file |
| **Storage** | `DELETE` | `/api/storage/file` | Delete a file by path |

## Common Headers

| Header | Required | Purpose |
| :--- | :--- | :--- |
| `x-api-key` | Yes | Project API key (`pk_live_*` or `sk_live_*`) |
| `Authorization: Bearer <jwt>` | Required for `pk_live` writes with RLS | End-user identity for owner-based write checks |
| `x-refresh-token` | Optional (mobile/non-browser refresh flow) | Provide refresh token when cookies are not used |
| `Content-Type: application/json` | Required for JSON requests | Body parsing and validation |

## Status Code Reference

- `200 OK`: Request succeeded.
- `201 Created`: Document/User/File created successfully.
- `400 Bad Request`: Validation failure or malformed JSON.
- `401 Unauthorized`: Missing/Invalid API Key or expired JWT.
- `403 Forbidden`: Resource limit (Quota) exceeded or blocked by RLS policy.
- `404 Not Found`: Collection, document, or file does not exist.
- `500 Server Error`: Unexpected problem on our end.

## Key Behavior Notes

- `pk_live` can always perform read requests on `/api/data/*`.
- `pk_live` write requests on `/api/data/*` require collection-level RLS + user Bearer token.
- `users` collection operations are routed through `/api/userAuth/*`; `/api/data/users*` is blocked.
- In `userAuth` responses, `token` is a temporary backward-compatibility alias of `accessToken` and will be removed in a future release.

## Quick Write Matrix

| Key | Token | RLS Enabled | Result (non-users collections) |
| :--- | :--- | :--- | :--- |
| `pk_live` | No | Any | ❌ Write blocked |
| `pk_live` | Yes | No | ❌ Write blocked |
| `pk_live` | Yes | Yes | ✅ Allowed for owner-constrained writes |
| `sk_live` | No | Any | ✅ Allowed (server-trusted context) |

## Practical Examples

### Create document with secret key

```bash
curl -X POST "https://api.ub.bitbros.in/api/data/posts" ^
  -H "x-api-key: sk_live_xxx" ^
  -H "Content-Type: application/json" ^
  -d "{\"content\":\"Server side insert\",\"userId\":\"USER_ID\"}"
```

### Create document with publishable key + RLS + JWT

```bash
curl -X POST "https://api.ub.bitbros.in/api/data/posts" ^
  -H "x-api-key: pk_live_xxx" ^
  -H "Authorization: Bearer USER_JWT" ^
  -H "Content-Type: application/json" ^
  -d "{\"content\":\"Client insert\"}"
```

Expected: `201` with owner field auto-filled when missing.
