# RLS Implementation Roadmap (V1 -> Best Version)

This roadmap explains how to implement Supabase-style Row Level Security (RLS) for `urBackend` in progressive versions.

Goal:
- Allow **publishable key** to perform `POST/PUT/PATCH/DELETE` only when RLS policy permits.
- Keep **secret key** behavior unchanged (full admin bypass).
- Start simple, safe, low-latency in V1, then evolve to advanced policy engine.

---

## 0) Current State (Baseline)

Today in `public-api`:
- Read routes (`GET`) work with publishable key.
- Write routes (`POST/PUT/DELETE`) require secret key via `requireSecretKey`.
- No per-row policy evaluation on user identity.

Implication:
- Public client apps cannot securely do user-scoped writes with publishable key.

---

## 1) V1 (Recommended First Release)

### 1.1 What V1 Will Support

For each collection, enable an RLS mode:
- `public-read` policy:
  - Anyone can read.
  - Publishable key writes are allowed only if the authenticated end-user is writing their own document.
  - Ownership is checked by a configured field (e.g. `userId`, `ownerId`, `_id` for users collection).
- `private` policy:
  - Only the owner can read and write (requires a valid user token).

Write ops covered in V1:
- `POST`
- `PUT`
- `PATCH`
- `DELETE`

Read behavior in V1:
- `public-read` keeps existing behavior for reads.
- `private` filters reads by owner.

### 1.2 Data Model Changes

Add RLS config to `Project` -> collection level.

Suggested shape:
```js
collection.rls = {
  enabled: Boolean,
  mode: "public-read",
  ownerField: "userId",
  requireAuthForWrite: true
}
```

Defaults:
- `enabled: false` for existing projects.
- No behavior change unless explicitly enabled.

### 1.3 Request Context Changes (public-api)

Add middleware to resolve end-user auth context for publishable key writes:
- Read `Authorization: Bearer <token>`.
- Verify token using `project.jwtSecret`.
- Set `req.authUser = { userId, ...claims }`.

Failure behavior:
- If collection RLS write requires auth and token missing/invalid -> `401`.

### 1.4 Route Guard Changes

In `apps/public-api/src/routes/data.js`:
- Replace hard `requireSecretKey` on write routes with new `authorizeWriteOperation`.

`authorizeWriteOperation` logic:
- If key is secret -> allow.
- If key is publishable:
  - Ensure collection exists.
  - Ensure collection RLS enabled.
  - Ensure user token valid.
  - Evaluate owner policy for operation.

### 1.5 Policy Evaluation Rules (V1)

For `POST`:
- Incoming payload must set `ownerField` equal to `req.authUser.userId`.
- Optionally auto-inject ownerField server-side if missing.

For `PUT/PATCH/DELETE`:
- Load target doc by id.
- Compare `doc[ownerField]` with `req.authUser.userId`.
- Permit only on match.

### 1.6 Dashboard UI (V1)

In web dashboard:
- Add collection-level RLS section:
  - Enable/disable RLS toggle.
  - Mode selector (`public-read` or `private` in V1).
  - Owner field selector (from schema fields).
  - Save config.

UX defaults:
- If user enables RLS but ownerField invalid -> block save with clear error.

### 1.7 Security Guarantees (V1)

With publishable key:
- No write without valid user JWT.
- No cross-user writes if owner check fails.

With secret key:
- Existing admin behavior preserved.

### 1.8 Performance Impact (V1)

Expected overhead:
- JWT verify: small (few ms typically).
- For update/delete: one document fetch for owner check.

Mitigation:
- Keep logic in middleware + targeted DB fetch only for write ops.
- No extra overhead on read routes in V1.

---

## 2) V1.1 Hardening

After V1 stable:
- Add PATCH route support if not already present everywhere.
- Prevent owner field tampering on update:
  - Ignore or reject attempts to change ownerField.
- Add explicit structured error codes:
  - `RLS_NOT_ENABLED`
  - `RLS_AUTH_REQUIRED`
  - `RLS_OWNER_MISMATCH`
  - `RLS_OWNER_FIELD_MISSING`
- Add audit logs for denied operations.

---

## 3) V2 (Operation-wise Policies)

Introduce per-operation allow rules:
```js
rls: {
  enabled: true,
  write: {
    insert: { mode: "owner" },
    update: { mode: "owner" },
    delete: { mode: "owner" }
  }
}
```

Benefits:
- Allow insert but block delete, etc.
- Better product control without full policy language complexity.

---

## 4) V3 (Role-Based Rules)

Add role-aware policy checks using JWT claims:
- Example: `admin`, `manager`, `user`.
- Rule examples:
  - `admin` can update any doc.
  - `user` only own docs.

Policy shape can support:
```js
allowRoles: ["admin"]
fallbackMode: "owner"
```

---

## 5) V4 (Field-Level Controls)

Support column-level restrictions:
- Publishable writes cannot modify protected fields (`role`, `plan`, `isAdmin`, etc).
- Allowlist/denylist by operation.

Example:
```js
update: {
  mode: "owner",
  denyFields: ["role", "billingTier"]
}
```

---

## 6) V5 (Advanced Policy Engine / “Best Version”)

Supabase-like expressive policy model:
- Separate policies for `select/insert/update/delete`.
- Boolean expressions on:
  - `auth` claims
  - `doc` fields
  - request payload
  - optional org/team context

Examples:
- `auth.userId == doc.ownerId`
- `auth.orgId == doc.orgId && auth.role in ["admin","editor"]`
- `request.data.status != "archived"`

Implementation approach:
- Build safe expression evaluator (no raw `eval`).
- Precompile policy AST and cache per collection.

---

## 7) Migration Strategy

### Existing projects
- All existing collections default to `rls.enabled = false`.
- No breaking behavior after deploy.

### Opt-in rollout
- Users explicitly enable RLS per collection.
- Show warning banner before enable:
  - “Publishable key writes will require user auth token.”

### Backward compatibility
- Secret key flows unchanged in all versions.

---

## 8) Testing Strategy

### Unit tests
- Middleware token parsing/validation.
- Policy evaluator outcomes for all branches.

### Integration tests
- Publishable + no token -> denied write.
- Publishable + wrong owner token -> denied write.
- Publishable + correct owner token -> allowed.
- Secret key write -> allowed.

### Regression checks
- Existing dashboard admin flows unaffected.
- Public-read collections keep existing read behavior.

---

## 9) Observability & Ops

Add metrics counters:
- `rls_allowed_total`
- `rls_denied_total`
- denied reason tags (`owner_mismatch`, `token_missing`, etc.)

Add request logs for denied writes with:
- project id
- collection
- operation
- denial reason

---

## 10) Recommended Execution Order

1. V1 backend model + middleware + route guard + controller checks.
2. V1 dashboard toggle/settings UI.
3. Tests + staged rollout on a few projects.
4. V1.1 hardening.
5. V2/V3/V4 in small increments.
6. V5 advanced policy engine when product demand is clear.

---

## 11) Non-Goals for V1

To keep V1 low-risk:
- No complex expression parser.
- No multi-policy conflict resolution engine.

---

## 12) Success Criteria

V1 is successful when:
- Publishable key can do write ops securely for authenticated owner only.
- Secret key behavior remains fully compatible.
- P95 latency impact stays low and predictable.
- Dashboard UX clearly communicates why a write is denied.

