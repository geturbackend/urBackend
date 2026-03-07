# Schema Creation & Types 🧱

urBackend is powered by a dynamic schema engine. You can define your data structure visually in the dashboard, and our API will automatically enforce validation, provide type safety, and even generate your Admin UI.

## Supported Data Types

Every field in your collection must have a type. Here are the types urBackend supports:

| Type | Description | Example JSON |
| :--- | :--- | :--- |
| **String** | Alphanumeric text data. | `"title": "Hello World"` |
| **Number** | Integers or decimals. | `"price": 19.99` |
| **Boolean** | `true` or `false` values. | `"isActive": true` |
| **Date** | Any valid date or ISO string. | `"createdAt": "2024-03-07"` |
| **Object** | Nested JSON structure. | `"meta": { "views": 10 }` |
| **Array** | A list of values. | `"tags": ["tech", "ai"]` |
| **Ref** | Reference to another document ID. | `"author": "642f9..."` |

## 1. Required Fields ⚠️

When you toggle a field as **Required** in the dashboard, the API will reject any `POST` or `PUT` request that doesn't include that field. This ensures your database always has the data your application needs.

## 2. Nested Objects 📦

You can create complex, hierarchical data structures by using the **Object** type.
- In the Dashboard: Add a field, set type to `Object`, then add "Sub-fields" inside it.
- In the API: Send a normal nested JSON object.

```json
{
  "profile": {
    "avatar": "url...",
    "bio": "Developer at heart"
  }
}
```

## 3. Arrays 📊

The **Array** type allows you to store lists of values. 
- In the Dashboard: Set type to `Array`.
- In the API: Send a standard JSON array `[]`.

```json
{
  "categories": ["electronics", "smartphones", "deals"]
}
```

## 4. References (Ref/Lookup) 🔗

References allow you to link documents between collections (similar to foreign keys or Joins).
- **Setup**: Set type to `Ref` and choose the target collection.
- **Usage**: Store the `_id` of the document you want to link to.
- **Benefit**: This enables you to build relational data structures while keeping the flexibility of NoSQL.

---

> [!TIP]
> Always define your **"users"** collection schema manually before enabling Authentication to ensure your custom user fields (like `avatar` or `role`) are properly validated.
