"""
urbackend — Official Python SDK for urBackend.

Quick start::

    from urbackend import UrBackendClient

    client = UrBackendClient(api_key="pk_live_YOUR_KEY")

    # Auth
    session = client.auth.login("alice@example.com", "secret123")
    user    = client.auth.me()

    # Database
    posts = client.db.get_all("posts", sort="createdAt:desc", limit=10)
    post  = client.db.insert("posts", {"title": "Hello"},
                             token=client.auth.get_token())

    # Chainable collection API
    items = client.db.collection("products").find({"category": "books"})
    item  = client.db.collection("products").insert({"name": "Widget"})

    # Storage
    with open("report.pdf", "rb") as f:
        upload_result = client.storage.upload(f, filename="report.pdf")

    # Mail (server-side, Secret Key required)
    server_client = UrBackendClient(api_key="sk_live_YOUR_SECRET")
    server_client.mail.send(
        to="user@example.com",
        template_name="welcome",
        variables={"name": "Alice", "projectName": "Acme",
                   "appUrl": "https://acme.com"},
    )
"""

from .client import UrBackendClient
from .exceptions import (
    AuthError,
    NotFoundError,
    RateLimitError,
    StorageError,
    UrBackendError,
    ValidationError,
)

__version__ = "0.1.0"
__all__ = [
    "AuthError",
    "NotFoundError",
    "RateLimitError",
    "StorageError",
    "UrBackendClient",
    "UrBackendError",
    "ValidationError",
]
