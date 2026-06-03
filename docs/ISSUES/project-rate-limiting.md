---
title: Project & API-key Rate Limiting
labels: bug, security, infra
assignees: ''
---

# Project & API-key Rate Limiting

Date: 2026-05-22

## Summary

There is confusion and a small gap in rate limiting for `apps/public-api`.

- A global IP-based express limiter exists and is applied (`api_usage.js`).
- Per-project plan limits are enforced asynchronously via Redis in `usageGate.checkUsageLimits` after API-key verification.
- A `projectRateLimiter` express middleware exists (`projectRateLimiter.js`) but is not wired into any routes and contains an implementation issue.

This issue tracks fixing and hardening per-project / per-API-key rate limiting so generated CRUD endpoints cannot be abused to cause DDoS or runaway DB costs.

## Impact

- Possible API abuse or DoS by hitting generated endpoints.
- Runaway MongoDB Atlas costs for projects using BYO-Database due to unbounded request volume.

## Reproduction

1. Observe that `/api/data/*` and many `/api/mail/*` endpoints accept `x-api-key`.
2. Send high-volume requests from multiple IPs or with the same API key.
3. Global IP limiter will throttle per-IP, but per-project hard limits are not applied at the express middleware layer.

## Root causes / gaps

- `projectRateLimiter.js` uses a nonstandard option and is never imported/used.
- `checkUsageLimits` enforces plan-based limits via Redis but is asynchronous and may allow short bursts before counters are incremented.
- Some `mail` admin routes use `verifyApiKey` + `requireSecretKey` but lack `checkUsageLimits`.

## Proposed fix

1. Fix `projectRateLimiter` implementation:
   - Use `express-rate-limit` `max` and `keyGenerator` correctly.
   - Use a Redis-backed store (e.g., `rate-limit-redis`) for production clustering.
   - Keying options: prefer `req.project._id` or `req.hashedApiKey` (decide per-route).

2. Wire `projectRateLimiter` after `verifyApiKey` on per-project routes:
   - `app.use('/api/data', ..., verifyApiKey, projectRateLimiter, ...)` or add to route-level middleware arrays in `routes/data.js` and `routes/mail.js` where appropriate.

3. Ensure `checkUsageLimits` is applied to all endpoints that should be metered (add to missing `mail` routes).

4. (Optional) Add a per-API-key express limiter (key by `req.hashedApiKey`) for stricter per-key bursts.

5. Add tests: unit/integration tests to validate that per-project limits reject requests with 429, and that `checkUsageLimits` and express limiter co-exist.

6. Update docs: README / security docs to describe global, per-project and per-key limits and expected defaults.

## Implementation checklist

- [ ] Fix `projectRateLimiter.js` implementation (use `max`, `keyGenerator`, Redis store)
- [ ] Add `projectRateLimiter` to `routes/data.js` after `verifyApiKey`
- [ ] Add `projectRateLimiter` to `routes/mail.js` for admin/send endpoints where `requireSecretKey` is used
- [ ] Ensure missing `checkUsageLimits` calls are added to mail routes that should be metered
- [ ] Add integration tests in `apps/public-api/__tests__` that assert 429 behavior
- [ ] Update docs: `docs/ISSUES/project-rate-limiting.md` and README sections
- [ ] Optional: add per-API-key limiter and configuration flag (on by default)

## Acceptance criteria

- Per-project express limiter is active and returns 429 when a project's configured hard-limit is exceeded.
- Redis-backed plan checks in `checkUsageLimits` remain and are consistent with express limiter thresholds.
- Tests cover both express limiter and Redis plan enforcement.
- Documentation updated to reflect protections.

## Notes

- This was initially reported as “no per-project or per-API-key rate limiting” — the codebase has protections, but the `projectRateLimiter` was present and unused. The fix provides defense-in-depth (fast-fail middleware + Redis metering).

---
