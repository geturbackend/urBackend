# Changelog

All notable changes to urBackend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [v0.9.0] - 2026-04-09

### Added
- Webhook system with BullMQ retry logic for reliable event delivery
- Bring Your Own Key (BYOK) support for transactional mail via Resend

### Fixed
- Follow-up issues from Social Auth PR #81 (social auth edge cases)

---

## [v0.8.0] - 2026-04-06

### Added
- GitHub and Google OAuth 2.0 social login support
- Secure one-time `rtCode` token exchange mechanism
- Automatic account linking when provider email matches an existing user
- Auto-generated, read-only provider callback URLs in the dashboard
- Encrypted storage for OAuth client secrets
- `/api/userAuth/social/exchange` endpoint for frontend callback handling
- Aria labels for improved accessibility in `CollectionsTable.jsx` and `DatabaseSidebar.jsx`
- Working example added at `examples/social-demo/`

### Fixed
- Email collision protection — rejects social login if email exists but provider email is unverified
- OAuth error forwarding — provider errors now redirect to frontend with `?error=...`

### Security
- Site URL must be configured before enabling social auth providers
- API key verification enforced on the `/social/exchange` endpoint

---

## [v0.7.0] - 2026-04-04

### Added
- Row-Level Security (RLS) read modes: `public-read` and `private`
- Unique field constraints on collections enforced at the database level
- Backward compatibility for existing `owner-write-only` RLS rules

### Changed
- JWT refresh flow now uses rotating sessions
- Documentation updated for new RLS security patterns

### Fixed
- Synchronized monorepo versioning across all core apps
- Duplicate key issues in package manifests

---

## [v0.6.0] - 2026-03-31

### Added
- AWS S3 storage integration with full region support
- Cloudflare R2 storage integration (S3-compatible)
- Storage Adapter Pattern — consistent `.upload()`, `.remove()`, `.list()`, `.getPublicUrl()` API across all providers
- `publicUrlHost` field for mapping custom CDN/CloudFront domains to storage assets
- Dynamic Project Settings form that adapts based on the selected storage provider

### Fixed
- `package-lock.json` integrity mismatch causing CI/CD failures
- S3 root directory listing bug (trailing slash appended incorrectly)
- UI label typos in Storage Configuration panel

### Security
- All external storage credentials encrypted at rest using AES-256-GCM

---

## [v0.5.0] - 2026-03-29

### Added
- `POST /api/userAuth/refresh-token` endpoint
- `POST /api/userAuth/logout` endpoint
- Redis-backed refresh session store with fields: `tokenId`, `projectId`, `userId`, `tokenHash`, `rotatedFrom`, `rotatedTo`, `isUsed`, `revokedAt`, `expiresAt`, `lastUsedAt`
- Refresh token rotation on each successful refresh
- Replay detection and full session-chain revocation on token reuse
- Rate checks for refresh attempts (per IP, token, and user)
- Mobile/non-browser support via `x-refresh-token` header
- New environment variables: `PUBLIC_AUTH_ACCESS_TOKEN_TTL` (default: `15m`), `PUBLIC_AUTH_REFRESH_TOKEN_TTL_SECONDS` (default: `604800`)

### Changed
- `token` retained as backward-compatible alias; `accessToken` is now the canonical field
- Docs updated: `docs/authentication.md`, `docs/api-reference.md`

---

## [v0.4.0] - 2026-03-29

### Added
- Row-Level Security (RLS) for collection writes (`owner-write-only` mode)
- Publishable key write guardrails — `pk_live` writes now require RLS + user JWT
- Automatic owner field injection on document create when owner field is absent
- Protection on `/api/data/users*` routes — user management now strictly via `/api/userAuth/*`
- Auth schema validation hardening: `email` and `password` required as string fields

### Fixed
- Owner mismatch blocking for write operations
- Schema key normalization hardening (handles hidden/BOM character edge cases)
- Safer `users` schema sanitation for Mongoose subdocuments

---

## [v0.3.0] - 2026-03-22

### Added
- NPM Workspaces monorepo structure with `apps/*` and `packages/*` directories
- `@urbackend/common` shared package — Mongoose models, Express middlewares, Redis queues, DB configs
- `dashboard-api` (Control Plane) — dedicated backend for admin dashboard (project creation, API key management, developer auth)
- `public-api` (Data Plane) — scalable backend for project data routing, schema validation, and storage
- Concurrent dev mode — `npm run dev` at root starts frontend, `dashboard-api`, and `public-api` simultaneously with colored logging
- Full Docker Compose setup — `docker-compose up` spins up MongoDB, Redis, and both API services
- Isolated rate limiting and error handlers for public and admin routes
- Multistage Dockerfiles with proper layer caching

### Changed
- Legacy monolithic `legacy-backend` deprecated and removed

---

## [v0.2.0] - 2026-03-08

### Added
- Bring Your Own Database (BYOD) — connect an external MongoDB URI to any project
- Dual API key system: `pk_live_` (publishable, frontend-safe) and `sk_live_` (secret, server-side)
- CORS Allowed Domains — `pk_live` requests rejected from un-whitelisted origins
- Dynamic Auth setup — Auth activation blocked until a valid `users` collection is defined
- Brute-force protection via dedicated `authLimiter`; JWT expiry explicitly set to 7 days; OTP attempts capped
- Deep schema nesting: `Object`, `Array`, and `Ref` (relational) types supported
- Advanced query engine: filter operators (`_gt`, `_lt`, `_gte`, `_lte`), `sort=field:order`, and pagination (`page`/`limit`)
- Dynamic user forms on Auth page — auto-generates inputs from custom `users` schema
- Secure admin controls: send OTPs, reset passwords, manage profiles from the dashboard
- `docker-compose.yml` for full local self-hosting

### Fixed
- Double OTP issue during developer signups
- Redis caching bug where raw Mongoose documents corrupted application state
- Analytics visit counter now persists across server restarts via database
- Safe project deletion — external databases and Supabase storage buckets safely ignored during teardown

### Security
- Docker containers now run as non-root users
- Internal database and cache ports fully isolated
- IDOR patches — developers can only modify resources they own

---

## [v0.1.0] - 2026-01-09

### Added
- Instant NoSQL database — create collections and manage JSON data through a visual dashboard, powered by dynamic Mongoose models
- Built-in authentication — signup, login (JWT), and profile management with zero boilerplate
- Integrated cloud storage — file and image uploads via Supabase with public CDN links
- Project dashboard — unified interface to manage multiple projects, define schemas, and monitor data
- Developer analytics — real-time API traffic and usage monitoring via interactive charts
- API key-based access control

---

[v0.9.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.9.0
[v0.8.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.8.0
[v0.7.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.7.0
[v0.6.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.6.0
[v0.5.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.5.0
[v0.4.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.4.0
[v0.3.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.3.0
[v0.2.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.2.0
[v0.1.0]: https://github.com/geturbackend/urBackend/releases/tag/v0.1.0
