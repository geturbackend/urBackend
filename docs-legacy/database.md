# Database Operations 🗄️

urBackend provides a simplified RESTful interface for MongoDB. There is no need to write SQL or complex aggregation pipelines—just use simple JSON.

## Collection Access

All database endpoints follow the pattern:
`https://api.ub.bitbros.in/api/data/:collectionName`

Replace `:collectionName` with the name of your collection (e.g., `posts`, `comments`, `inventory`).

> [!IMPORTANT]
> The `users` collection is managed through `/api/userAuth/*` endpoints.
> Direct users access via `/api/data/users*` is blocked.

## 1. Create a Document

**Endpoint**: `POST /api/data/:collectionName`

By default, write operations require your **secret key**.

If you enable **RLS** for a collection from the dashboard, publishable-key writes are also allowed but must include a valid user token:

- `x-api-key: pk_live_...`
- `Authorization: Bearer <user_jwt>`

Under RLS, writes are permitted only for documents owned by the authenticated user (based on configured `ownerField`).
If the `ownerField` is missing in a `POST` payload, urBackend can auto-fill it from the authenticated user id.

RLS read modes:
`public-read` lets anyone read, while `private` restricts reads to the owner's documents and requires a valid user token.

```javascript
await fetch('https://api.ub.bitbros.in/api/data/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_KEY' },
  body: JSON.stringify({
    title: "Why BaaS is the future",
    body: "Content goes here...",
    tags: ["tech", "development"],
    meta: { views: 0, likes: 0 }
  })
});
```

## 2. Read Documents

### Fetch All
**Endpoint**: `GET /api/data/:collectionName`

```bash
curl "https://api.ub.bitbros.in/api/data/posts" ^
  -H "x-api-key: pk_live_xxx"
```

### Fetch Single Document
**Endpoint**: `GET /api/data/:collectionName/:id`

```bash
curl "https://api.ub.bitbros.in/api/data/posts/64fd1234abcd5678ef901234" ^
  -H "x-api-key: pk_live_xxx"
```

## 2.1 Query Parameters

You can refine your `GET` requests using the following query parameters:

| Parameter | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `populate` | `String` | `?populate=author,category` | Expand `Ref` fields into full objects. |
| `expand` | `String` | `?expand=author` | Alias for `populate`. |
| `sort` | `String` | `?sort=createdAt:desc` | Sort results by field and order. |
| `limit` | `Number` | `?limit=25` | Number of documents to return (default: 100, max: 100). |
| `page` | `Number` | `?page=2` | 1-indexed page number for pagination. |

### Relational Data (Population) 🔗

If you have fields defined as `Ref` (singular) or `Array of Ref` in your schema, urBackend can automatically join those documents for you. 

By default, urBackend returns raw IDs for references. Use `?populate=` to get the full nested object.

```bash
# Get posts with full author and category objects
curl "https://api.ub.bitbros.in/api/data/posts?populate=author,category" ^
  -H "x-api-key: pk_live_xxx"
```

> [!TIP]
> This solves the N+1 query problem, allowing you to fetch complex relational data in a single request.

## 3. Update a Document

**Endpoint**: `PUT /api/data/:collectionName/:id`

urBackend uses `$set` logic, meaning you only need to send the fields you want to change.

```javascript
const postId = "YOUR_DOCUMENT_ID";
await fetch(`https://api.ub.bitbros.in/api/data/posts/${postId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_KEY' },
  body: JSON.stringify({
    "meta.views": 105 // Nested updates are supported!
  })
});
```

### Partial Update
**Endpoint**: `PATCH /api/data/:collectionName/:id`

```javascript
await fetch(`https://api.ub.bitbros.in/api/data/posts/${postId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', 'x-api-key': 'YOUR_KEY' },
  body: JSON.stringify({
    title: "Edited title only"
  })
});
```

## 4. Delete a Document

**Endpoint**: `DELETE /api/data/:collectionName/:id`

```bash
curl -X DELETE "https://api.ub.bitbros.in/api/data/posts/64fd1234abcd5678ef901234" ^
  -H "x-api-key: sk_live_xxx"
```

## Validation & Schemas

If you define a schema in the dashboard, urBackend will enforce it for every `POST` and `PUT` request. 

- **Object Support**: You can define a field as an `Object` and send nested JSON.
- **Array Support**: Define a field as an `Array` for lists of data.
- **References (Ref)**: Link documents across collections by storing their `_id`.

## Common Failure Cases (and why)

- `401 Unauthorized`: missing/invalid API key or missing/invalid JWT for `pk_live` writes under RLS.
- `403 Forbidden`: owner mismatch in RLS write checks.
- `400 Bad Request`: schema validation failed (wrong type/missing required field).
- `404 Not Found`: collection or document id does not exist.
