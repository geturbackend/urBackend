# 🎯 Quick Setup Guide - urBackend Collections

## Step-by-Step Collection Setup

### ⚠️ STEP 0: Enable Authentication (MUST DO FIRST!)

1. Login to urBackend Dashboard: https://urbackend.bitbros.in
2. Go to your project
3. Navigate to **Settings** or **Authentication** section
4. **Enable Authentication** - Click the toggle/button
5. This will automatically create a `users` collection with these fields:
   - ✅ `email` (String, Required, Unique)
   - ✅ `password` (String, Required, Auto-hashed with bcrypt)

---

### 📝 STEP 1: Update `users` Collection

After authentication is enabled, go to the `users` collection schema and **ADD** these fields:

```
Field Name        | Type    | Required | Unique | Default
------------------|---------|----------|--------|----------
username          | String  | Yes      | Yes    | -
displayName       | String  | No       | No     | -
bio               | String  | No       | No     | -
avatar            | String  | No       | No     | -
banner            | String  | No       | No     | -
verified          | Boolean | No       | No     | false
location          | String  | No       | No     | -
website           | String  | No       | No     | -
followersCount    | Number  | No       | No     | 0
followingCount    | Number  | No       | No     | 0
```

For GitHub social auth in this demo, these extra `users` fields are recommended:

```
Field Name        | Type    | Required | Unique | Default
------------------|---------|----------|--------|----------
githubId          | String  | No       | No     | -
authProviders     | Array   | No       | No     | []
```

**Complete `users` schema will have:**
- email ✅ (auto-created)
- password ✅ (auto-created)
- username + 9 additional fields (you add these)
- optional social-auth metadata fields for GitHub sign-in

---

### 📝 STEP 2: Create `posts` Collection

Create a new collection named **`posts`** with these fields:

```
Field Name          | Type    | Required | Default
--------------------|---------|----------|----------
userId              | String  | Yes      | -
authorId            | String  | Yes      | -
authorUsername      | String  | Yes      | -
authorDisplayName   | String  | No       | -
authorAvatar        | String  | No       | -
authorVerified      | Boolean | No       | false
content             | String  | Yes      | -
images              | Array   | No       | []
likesCount          | Number  | No       | 0
commentsCount       | Number  | No       | 0
retweetsCount       | Number  | No       | 0
createdAt           | Date    | No       | Date.now
```

**RLS settings for `posts` (required):**
- enabled: `true`
- mode: `public-read`
- ownerField: `userId`
- requireAuthForWrite: `true`

---

### 📝 STEP 3: Create `profiles` Collection

Create a new collection named **`profiles`** with these fields:

```
Field Name          | Type    | Required | Unique | Default
--------------------|---------|----------|--------|----------
userId              | String  | Yes      | Yes    | -
username            | String  | Yes      | Yes    | -
displayName         | String  | No       | No     | -
bio                 | String  | No       | No     | -
avatar              | String  | No       | No     | -
banner              | String  | No       | No     | -
verified            | Boolean | No       | No     | false
location            | String  | No       | No     | -
website             | String  | No       | No     | -
followersCount      | Number  | No       | No     | 0
followingCount      | Number  | No       | No     | 0
createdAt           | Date    | No       | No     | Date.now
updatedAt           | Date    | No       | No     | Date.now
```

**RLS settings for `profiles` (required):**
- enabled: `true`
- mode: `public-read`
- ownerField: `userId`
- requireAuthForWrite: `true`

---

### 📝 STEP 4: Create `comments` Collection

Create a new collection named **`comments`** with these fields:

```
Field Name          | Type    | Required | Default
--------------------|---------|----------|----------
postId              | String  | Yes      | -
userId              | String  | Yes      | -
authorId            | String  | Yes      | -
authorUsername      | String  | Yes      | -
authorDisplayName   | String  | No       | -
authorAvatar        | String  | No       | -
content             | String  | Yes      | -
likesCount          | Number  | No       | 0
createdAt           | Date    | No       | Date.now
```

**RLS settings for `comments` (required):**
- enabled: `true`
- mode: `public-read`
- ownerField: `userId`
- requireAuthForWrite: `true`

---

### 📝 STEP 5: Create `likes` Collection

Create a new collection named **`likes`** with these fields:

```
Field Name    | Type    | Required | Index
--------------|---------|----------|-------
userId        | String  | Yes      | Yes
targetId      | String  | Yes      | Yes
targetType    | String  | Yes      | No (enum: "post" or "comment")
createdAt     | Date    | No       | Date.now
```

**Important:** Create a compound unique index on `userId + targetId` to prevent duplicate likes.

**RLS settings for `likes` (required):**
- enabled: `true`
- mode: `public-read`
- ownerField: `userId`
- requireAuthForWrite: `true`

---

### 📝 STEP 6: Create `follows` Collection

Create a new collection named **`follows`** with these fields:

```
Field Name    | Type    | Required | Index
--------------|---------|----------|-------
followerId    | String  | Yes      | Yes
followingId   | String  | Yes      | Yes
createdAt     | Date    | No       | Date.now
```

**Important:** Create a compound unique index on `followerId + followingId` to prevent duplicate follows.

**RLS settings for `follows` (required):**
- enabled: `true`
- mode: `public-read`
- ownerField: `userId`
- requireAuthForWrite: `true`

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] Authentication is enabled in urBackend dashboard
- [ ] `users` collection exists with `email` and `password` fields
- [ ] `users` collection has all 11 additional fields added
- [ ] `posts` collection created with 12 fields
- [ ] `profiles` collection created with 13 fields
- [ ] `comments` collection created with 9 fields
- [ ] `likes` collection created with 4 fields
- [ ] `follows` collection created with 3 fields
- [ ] RLS enabled on `posts`, `profiles`, `comments`, `likes`, `follows` with ownerField `userId`
- [ ] Total: 6 collections in your urBackend project

---

## 🔑 Get Your API Keys

1. Go to urBackend Dashboard → Project Settings
2. Copy your **Public Key** (`pk_live_...`) 
3. Copy your **Secret Key** (`sk_live_...`) (needed only for `/storage/*` upload proxy)
4. Paste them in your `.env` files (see main README.md)

---

## 🚀 Ready to Go!

Once all collections are created and API keys are configured, you can run the app:

```bash
# Terminal 1
cd server
npm start

# Terminal 2
cd client
npm run dev
```

Open http://localhost:5173 and create your first account! 🎉

---

## ❓ Common Issues

**Q: I don't see "Enable Authentication" option?**
A: Look for "Auth Settings", "User Management", or check the main settings page. It might be under a different menu.

**Q: Can I use different field names?**
A: No, the app code expects these exact field names. Changing them will break functionality.

**Q: What if I already created `users` collection manually?**
A: Delete it and enable Authentication to let urBackend create it properly with password hashing.

**Q: Do I need to add indexes manually?**
A: urBackend automatically indexes `_id`. For better performance, you can add indexes on frequently queried fields like `authorId`, `userId`, etc.

---

**Need help?** Check the full [SETUP.md](./SETUP.md) or join the Discord!
