# AGENTS.md

## Overview

`urBackend` is a monorepo for a MongoDB-native BaaS.

Main apps:
- `apps/dashboard-api`: admin/project management API for the dashboard (Node.js/Express)
- `apps/public-api`: public project API for data, auth, storage (Node.js/Express)
- `apps/web-dashboard`: React/Vite dashboard (Tailwind v4, Geist minimal dark/light theme)
- `apps/consumer`: Consumer Worker for background jobs, exports, and webhooks (BullMQ)
- `apps/python-service`: Python AI Microservice (FastAPI/Groq, Pydantic, schema generation & query builder)
- `packages/common`: shared models, validation, middleware, encryption, DB/model utilities, queues

SDKs:
- `sdks/urbackend-sdk`: Core TypeScript/JavaScript SDK (Framework-agnostic)
- `sdks/urbackend-react`: React SDK (`UrProvider`, `useUrContext`, UI components)
- `sdks/urbackend-python`: Official Python SDK (Requests-based)
- `sdks/urbackend-cli` : Official CLI to Manage urbackend projects

Workspace scripts are defined in [package.json](/package.json).

## Production Deployment Endpoints & Domains

- **Frontend Landing**: `https://urbackend.bitbros.in`
- **Dashboard App**: `https://app.urbackend.bitbros.in`
- **Dashboard API (Internal/Admin)**: `https://api.urbackend.bitbros.in`
- **Public API (SDK & User Auth)**: `https://api.ub.bitbros.in`

## Important project rules

1. **Do not treat `users` like a normal collection.**
   - Public access to `/api/data/users*` is blocked.
   - User auth flows must go through `/api/userAuth/*`.
   - Dashboard admin user management uses dedicated admin routes.

2. **Preserve the current RLS model.**
   - Supported modes are `public-read` and `private`.
   - `owner-write-only` is legacy and must be treated as `public-read`.
   - Read filtering is enforced in `public-api`.
   - Write ownership is enforced in `authorizeWriteOperation`.

3. **Social auth flow rules.**
   - Provider callback URLs are backend-generated and read-only in the dashboard.
   - Users only configure `enabled`, `clientId`, and `clientSecret`.
   - Post-login redirect comes from `project.siteUrl`, not provider-specific redirect fields.
   - Successful provider auth redirects to `<siteUrl>/auth/callback`.

4. **Secrets and BYOK keys must stay encrypted at rest and in transit.**
   - Secrets stored at rest in MongoDB must use AES-256-GCM via `packages/common/src/utils/encryption.js`.
   - Keys sent to the internal Python AI service are transit-encrypted using `encryptForTransit`.

5. **Hierarchical BYOK (Bring Your Own Key) Resolution for AI:**
   - 1st Priority: Project-level Groq Key (`project.byok.groqKey`)
   - 2nd Priority: Developer-level Groq Key (`developer.byok.groqKey`)
   - Fallback: Platform shared pool (subject to atomic Redis Lua quota limits and plan enforcement)
   - Developer BYOK endpoint is `PUT /api/user/me/byok` (with alias `PUT /api/auth/me/byok`). Project BYOK is `PUT /api/projects/:projectId/byok`.

6. **The `users` schema contract is still required for auth.**
   - `email` required `String`
   - `password` required `String`
   - Social-auth-created users still get a generated hashed password to satisfy this contract.

7. **Theme & UI Density Guidelines (Web Dashboard):**
   - Use CSS design tokens from `index.css` (`var(--color-bg-main)`, `var(--color-bg-card)`, `var(--color-bg-input)`, `var(--color-text-main)`, `var(--color-text-muted)`, `var(--color-border)`).
   - **Never hardcode dark colors** (`#111`, `#fff`, `#ededed`, or raw `rgba(0,0,0,...)`) in component inline styles or classes to avoid breaking Light Mode.
   - Maintain high information density: compact table rows (32px height), tight paddings (0.65rem–0.85rem), and 0 outer margins on primary workspaces.

## Current social auth implementation

Implemented providers:
- GitHub
- Google

Key files:
- [Project.js](/packages/common/src/models/Project.js)
- [project.controller.js](/apps/dashboard-api/src/controllers/project.controller.js)
- [userAuth.controller.js](/apps/public-api/src/controllers/userAuth.controller.js)
- [Auth.jsx](/apps/web-dashboard/src/pages/Auth.jsx)
- [AuthCallback.jsx](/apps/web-dashboard/src/pages/AuthCallback.jsx)
- [ProjectSettings.jsx](/apps/web-dashboard/src/pages/ProjectSettings.jsx)

Behavior:
- Start route requires `x-api-key` and enabled auth.
- Callback route uses Redis-backed `state`, reloads project config from DB, exchanges code, resolves/creates the user, issues urBackend tokens, then redirects to frontend.
- Existing users are linked by verified email when possible.

## Current dashboard UX decisions

- Social auth details are not shown inline on the main Auth page.
- Main Auth page shows a compact Social Auth section.
- Provider configuration is opened via a modal.
- Provider selection happens inside the modal, one provider at a time.
- `Site URL` is configured in Project Settings and reused by social auth.

## Redis key patterns
- Refresh session: `project:auth:refresh:session:{tokenId}`
- OAuth state: `project:auth:oauth:state:{state}` (10min TTL)
- Social Refresh Exchange: `project:social-auth:refresh-exchange:{rtCode}` (Uses atomic `GETDEL` for concurrency safety)
- Mail count: `project:mail:count:{projectId}:{YYYY-MM}` (TTL = end of month)
- AI Iteration session: `ai:session:{sessionId}` (TTL = 1 hour)
- AI Monthly Quota: `ai:usage:{devId}:{YYYY-MM}`
- Cache invalidation pub/sub: `project:cache:invalidate`
- Do NOT change these patterns — existing sessions will break

## API response format
All endpoints return: `{ success: bool, data: {}, message: "" }`
Use AppError class for errors — never raw throw, never expose MongoDB errors to client.

## Key environment variables
- `PUBLIC_AUTH_ACCESS_TOKEN_TTL` (default: 15m)
- `PUBLIC_AUTH_REFRESH_TOKEN_TTL_SECONDS` (default: 604800)
- `FRONTEND_URL` — used for OAuth callback redirect & CORS
- `PYTHON_SERVICE_URL` — URL for Python AI microservice (e.g. `http://localhost:8000`)
- `INTERNAL_SERVICE_SECRET` — secret key for transit encryption / internal service auth
- Check `.env.example` for full list

## Common places to edit

### If you change project config shape
Update all of:
- shared model in `packages/common`
- validation in `packages/common/src/utils/input.validation.js`
- dashboard-api read/update sanitization
- dashboard UI consumers

### If you change public auth behavior
Check:
- `apps/public-api/src/controllers/userAuth.controller.js`
- `apps/public-api/src/routes/userAuth.js`
- `apps/public-api/src/utils/refreshToken.js`
- social auth tests
- refresh token tests

### If you change collection behavior
Check:
- schema validation in `packages/common`
- model compilation in `packages/common/src/utils/injectModel.js`
- dashboard create collection UI
- dashboard-api collection creation/index creation flow

### If you change AI collection creator or query generation
Check:
- `apps/python-service/app/main.py` and services
- `apps/dashboard-api/src/controllers/ai.controller.js`
- `apps/web-dashboard/src/components/CollectionCreatorAgent.jsx`
- `apps/web-dashboard/src/components/Database/AiQueryBar.jsx`

### If you change global mail templates
Check:
- `mailtemplates` collection data (global templates are DB-only, not code-seeded)
- import source file `tools/db-import/global-mail-templates.json`
- dashboard mail templates UI/preview in `apps/web-dashboard/src/pages/ProjectSettings.jsx`
- template resolution path in `apps/public-api/src/controllers/mail.controller.js`

## Commands

Run all dev servers:
```bash
npm run dev
```

Run public API tests:
```bash
cd apps/public-api
npx jest --testPathPatterns=src/ --runInBand
```

Run dashboard API tests:
```bash
cd apps/dashboard-api
npx jest --testPathPatterns=src/ --runInBand
```

Run web dashboard lint:
```bash
cd apps/web-dashboard
npm run lint
```

Run web dashboard build:
```bash
cd apps/web-dashboard
npm run build
```

Run python service tests:
```bash
cd apps/python-service
pytest
```

Run SDK tests:
```bash
# JS Core SDK
npm run test --workspace=@urbackend/sdk

# React SDK (Vitest)
npm run test --workspace=@urbackend/react

# Python SDK (pytest)
cd sdks/urbackend-python
pytest
```

## Testing expectations

Before shipping auth, RLS, or schema changes:
- run `apps/public-api` tests
- run `apps/dashboard-api` tests
- run `apps/python-service` tests
- run `@urbackend/sdk` tests
- run `@urbackend/react` tests
- run `apps/web-dashboard` lint
- run `apps/web-dashboard` build when frontend changed

For Jest in this repo, `--runInBand` is often safer in constrained Windows environments.

## Known non-blocking warning

`apps/web-dashboard` currently builds successfully but Vite warns about large chunks. This is not a release blocker by itself.

## Practical guidance for future agents

- Prefer preserving existing behavior over “cleanup” changes in auth and RLS.
- Do not reintroduce editable provider callback URLs.
- Do not make social auth depend on dashboard login cookies; it belongs to project public auth.
- When touching docs, update both repo docs and in-dashboard docs if the user-facing flow changes.
