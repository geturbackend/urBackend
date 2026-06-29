# Fix allowedDomains cache invalidation and encrypt jwtSecret in Redis

## 🚀 Pull Request Description
Fixes # 286

This PR resolves two security and consistency issues related to project caching in Redis:
1. **Cache Invalidation Gap**: Corrects cache invalidation inside `deleteProjectByApiKeyCache`. When updating `allowedDomains` in the dashboard, the cache was not properly invalidated for publishable keys because the key was stored under the hashed value of the key (since `verifyApiKey.js` did not select `publishableKey` from the DB, resulting in it checking `undefined === apiKey` and caching it under the `hashedApi`). `deleteProjectByApiKeyCache` now deletes both raw and hashed versions of keys to guarantee proper invalidation.
2. **Plaintext Secrets**: Encrypts the sensitive `jwtSecret` field prior to writing to the Redis cache and decrypts it when retrieving. A graceful fallback is included to support reading existing plaintext entries without breaking active sessions.

## 🛠️ Type of Change
- [x] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 UI/UX improvement (Frontend only)
- [ ] ⚙️ Refactor / Chore

## 🧪 Testing & Validation
### Backend Verification:
- [x] I have run `npm test` in the `backend/` directory and all tests passed.
- [ ] I have verified the API endpoints using Postman/Thunder Client.
- [x] New unit tests have been added (if applicable).

### Frontend Verification:
- [ ] I have run `npm run lint` in the `frontend/` directory.
- [ ] Verified the UI changes on different screen sizes (Responsive).
- [ ] Checked for any console errors in the browser dev tools.

## 📸 Screenshots / Recordings (Optional)
## ✅ Checklist
- [x] My code follows the code style of this project.
- [x] I have performed a self-review of my code.
- [x] I have commented my code, particularly in hard-to-understand areas.
- [x] My changes generate no new warnings or errors.
- [x] I have updated the documentation (README/Docs) accordingly.

---
Built with ❤️ for **urBackend**.
