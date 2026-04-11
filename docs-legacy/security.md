# Security & Keys 🛡️

**your backend — your database — your rules.**

urBackend is built with a "Security-First" philosophy, specifically designed for developers who want full control over their data without sacrificing safety.

## Dual-Key System

We use two distinct types of API keys to prevent accidental data leaks:

| Key Type | Prefix | Shared Environment | Access Level |
| :--- | :--- | :--- | :--- |
| **Publishable** | `pk_live_` | Frontend / Client | Read by default; writes only with RLS + user JWT |
| **Secret** | `sk_live_` | Backend / Server | Full Access (CRUD) |

> [!CAUTION]
> **NEVER** commit your Secret Key to version control (GitHub/GitLab) or use it in frontend code.

## Protection Mechanisms

### 1. NoSQL Injection Prevention
Our API sanitizes top-level incoming JSON keys that start with `$`. Nested objects should still be validated carefully until recursive sanitization is added.

### 2. Rate Limiting
To prevent DDoS attacks and brute-force attempts:
- **Global API**: Limited to **100 requests per 15 minutes** per IP.
- **Auth Endpoints**: Protected by a stricter per-IP request limit.

### 3. Domain Whitelisting
In your dashboard, you can restrict API access to specific domains. When enabled, urBackend will reject any request that doesn't originate from your allowed list.

### 4. Schema Enforcement
When you define a schema, urBackend uses **Mongoose Model Validation** to ensure no "dirty" or unexpected data is saved to your database.

## Key Usage Rules (must follow)

- Use `pk_live` only in frontend/client apps.
- Use `sk_live` only on trusted server/backend environments.
- Never expose `sk_live` in browser bundles, client logs, or public repos.
- For end-user writes from frontend, enable RLS and send user JWT in `Authorization` header.

## Special Case: `users` Collection

- `/api/data/users*` is blocked intentionally.
- Use `/api/userAuth/*` for signup, login, profile, and password flows.
