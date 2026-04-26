# urbackend

Official Python SDK for [urBackend](https://urbackend.bitbros.in) — the instant Backend-as-a-Service for MongoDB.

[![PyPI version](https://img.shields.io/pypi/v/urbackend.svg)](https://pypi.org/project/urbackend/)
[![Python](https://img.shields.io/pypi/pyversions/urbackend.svg)](https://pypi.org/project/urbackend/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Installation

```bash
pip install urbackend
```

Requires Python ≥ 3.8 and [`requests`](https://pypi.org/project/requests/).

---

## Quick Start

```python
from urbackend import UrBackendClient

client = UrBackendClient(api_key="pk_live_YOUR_KEY")
```

### Authentication

```python
# Sign up a new user
user = client.auth.sign_up(
    email="alice@example.com",
    password="Sup3rS3cure!",
    username="alice",
)
print(user["_id"])

# Log in and cache the access token automatically
session = client.auth.login("alice@example.com", "Sup3rS3cure!")
print(session["accessToken"])

# Get the current user's profile (uses the cached token)
me = client.auth.me()
print(me["email"])

# Log out (clears token locally and on the server)
client.auth.logout()
```

### Database (CRUD)

```python
# --- Insert a document ---
post = client.db.insert(
    "posts",
    {"title": "Hello urBackend", "published": True},
    token=client.auth.get_token(),   # required when RLS is enabled
)
print(post["_id"])

# --- Fetch all documents with filters ---
posts = client.db.get_all(
    "posts",
    filter={"published": True},
    sort="createdAt:desc",
    limit=10,
)

# --- Chainable collection API (mirrors the TypeScript SDK style) ---
items = client.db.collection("products").find(
    {"category": "books"},
    sort="price:asc",
    limit=5,
)
new_item = client.db.collection("products").insert(
    {"name": "Clean Code", "price": 29.99},
    token=client.auth.get_token(),
)

# --- Get a single document by ID ---
product = client.db.get_one("products", "507f1f77bcf86cd799439011")
print(product["name"])

# --- Partial update (PATCH) ---
client.db.patch("products", product["_id"], {"price": 24.99})

# --- Full replacement (PUT) ---
client.db.update("products", product["_id"], {"name": "Clean Code", "price": 24.99})

# --- Delete ---
result = client.db.delete("posts", post["_id"], token=client.auth.get_token())
print(result["deleted"])   # True

# --- Count ---
total = client.db.count("orders", filter={"status": "pending"})
print(f"{total} pending orders")
```

### Storage

```python
# Upload from a file path
result = client.storage.upload("/tmp/report.pdf")
print(result["url"])

# Upload from an open file object
with open("avatar.png", "rb") as f:
    result = client.storage.upload(f, filename="avatar.png")

# Upload raw bytes
data = b"..."
result = client.storage.upload(data, filename="data.bin")

# Delete a file
client.storage.delete_file("uploads/old-report.pdf")
```

### Mail *(server-side only — requires Secret Key)*

```python
server_client = UrBackendClient(api_key="sk_live_YOUR_SECRET")

server_client.mail.send(
    to="new_user@example.com",
    template_name="welcome",          # built-in templates: welcome, otp, password-reset, invite
    variables={
        "name": "Alice",
        "projectName": "Acme Corp",
        "appUrl": "https://acme.com",
    },
)
```

> ⚠️ **Never expose your Secret Key (`sk_live_...`) in client-facing code.**
> Use the Publishable Key (`pk_live_...`) for all end-user requests.

---

## Social Auth

```python
# 1. Get the OAuth redirect URL and send the user there
url = client.auth.social_start_url("github")   # or "google"
# In Django: return redirect(url)

# 2. After the user returns to <siteUrl>/auth/callback?rtCode=...&token=...
#    exchange BOTH the rtCode and the one-time token (backend requires both)
rt_code = request.GET.get("rtCode")
token   = request.GET.get("token")
session = client.auth.social_exchange(rt_code, token)

# 3. Use the returned refreshToken to get an accessToken
new_session = client.auth.refresh_token(session["refreshToken"])
client.auth.set_token(new_session["accessToken"])
```

---

## Password Reset & Email Verification

```python
# Request a reset OTP
client.auth.request_password_reset("alice@example.com")

# Reset with the OTP from the email
client.auth.reset_password("alice@example.com", otp="123456", new_password="N3wP@ss!")

# Verify email address
client.auth.verify_email("alice@example.com", otp="654321")

# Resend verification OTP
client.auth.resend_verification_otp("alice@example.com")
```

---

## Error Handling

```python
from urbackend import (
    UrBackendClient,
    AuthError,
    NotFoundError,
    RateLimitError,
    ValidationError,
)

client = UrBackendClient(api_key="pk_live_YOUR_KEY")

try:
    product = client.db.get_one("products", some_id)
except NotFoundError:
    print("Product not found")
except AuthError:
    print("Invalid or missing API key / token")
except RateLimitError as e:
    print(f"Rate limited — retry after {e.retry_after}s")
except ValidationError as e:
    print(f"Bad request: {e.message}")
```

---

## API Reference

### `UrBackendClient(api_key, base?, extra_headers?)`

| Argument | Type | Default | Description |
|---|---|---|---|
| `api_key` | `str` | — | Publishable (`pk_live_...`) or Secret (`sk_live_...`) key |
| `base` | `str` | `https://api.ub.bitbros.in` | Override for self-hosted instances |
| `extra_headers` | `dict` | `{}` | Headers merged into every request |

---

### `client.auth`

| Method | Parameters | Returns |
|---|---|---|
| `sign_up(email, password, username?, **extra)` | — | `dict` (user) |
| `login(email, password)` | — | `dict` (session) |
| `me(token?)` | — | `dict` (profile) |
| `logout(token?)` | — | `dict` |
| `refresh_token(refresh_token?)` | — | `dict` (new session) |
| `update_profile(payload, token?)` | — | `dict` |
| `change_password(current, new, token?)` | — | `dict` |
| `public_profile(username)` | — | `dict` |
| `verify_email(email, otp)` | — | `dict` |
| `resend_verification_otp(email)` | — | `dict` |
| `request_password_reset(email)` | — | `dict` |
| `reset_password(email, otp, new_password)` | — | `dict` |
| `social_start_url(provider)` | `"github"` \| `"google"` | `str` |
| `social_exchange(rt_code, token)` | — | `dict` |
| `set_token(token)` | — | `None` |
| `get_token()` | — | `str \| None` |

---

### `client.db`

RLS is supported: pass the user's `accessToken` as `token=` to write operations.

| Method | Parameters | Returns |
|---|---|---|
| `collection(name)` | — | `CollectionRef` (chainable) |
| `get_all(collection, *, filter?, sort?, limit?, page?, skip?, populate?, expand?, token?)` | — | `list` |
| `count(collection, *, filter?, token?)` | — | `int` |
| `get_one(collection, doc_id, *, populate?, expand?, token?)` | — | `dict` |
| `insert(collection, data, token?)` | — | `dict` |
| `update(collection, doc_id, data, token?)` | — | `dict` (full replace) |
| `patch(collection, doc_id, data, token?)` | — | `dict` (partial) |
| `delete(collection, doc_id, token?)` | — | `{"deleted": bool}` |

**Filter operators** (append to field name):

| Suffix | Meaning | Example |
|---|---|---|
| `_gt` | greater than | `{"price_gt": 50}` |
| `_gte` | ≥ | `{"stock_gte": 1}` |
| `_lt` | less than | `{"age_lt": 30}` |
| `_lte` | ≤ | `{"rating_lte": 5}` |
| `_ne` | not equal | `{"status_ne": "deleted"}` |
| `_in` | in array | `{"tag_in": "python"}` |

---

### `client.storage`

| Method | Parameters | Returns |
|---|---|---|
| `upload(file, filename?, content_type?)` | `bytes \| IO \| path` | `{"url", "path", "provider"}` |
| `delete_file(path)` | — | `{"deleted": bool}` |

---

### `client.mail` *(server-side, Secret Key required)*

| Method | Parameters | Returns |
|---|---|---|
| `send(to, *, template_name?, variables?, subject?, html?, from_address?, cc?, bcc?)` | — | `dict` |

---

## Django / Flask Integration

```python
# settings.py (Django)
import os
from urbackend import UrBackendClient

urbackend = UrBackendClient(api_key=os.environ["URBACKEND_API_KEY"])

# views.py
from myapp.settings import urbackend
from urbackend import NotFoundError

def product_detail(request, product_id):
    try:
        product = urbackend.db.get_one("products", product_id)
    except NotFoundError:
        return HttpResponse(status=404)
    return JsonResponse(product)
```

---

## Contributing

This SDK lives in `sdks/urbackend-python/` inside the [urBackend monorepo](https://github.com/geturbackend/urBackend).
Please read the root [CONTRIBUTING.md](../../CONTRIBUTING.md) before opening a PR.

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run a single test file
pytest tests/test_auth.py -v
```

---

## License

MIT — see [LICENSE](../../LICENSE.md).
