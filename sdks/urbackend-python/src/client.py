"""
urBackend Python SDK — Main client.

Entry point that composes :class:`AuthModule`, :class:`DatabaseModule`,
:class:`StorageModule`, and :class:`MailModule` behind a single
``UrBackendClient`` object.
"""

from __future__ import annotations

import warnings
from typing import Dict, Optional

from .auth import AuthModule
from .db import DatabaseModule
from .exceptions import (  # re-export for convenience
    AuthError,
    NotFoundError,
    RateLimitError,
    StorageError,
    UrBackendError,
    ValidationError,
)
from .http import UrBackendHTTP
from .mail import MailModule
from .storage import StorageModule

_DEFAULT_BASE_URL = "https://api.ub.bitbros.in"


class UrBackendClient:
    """The main urBackend Python SDK client.

    Initialise once and reuse across your application.  All module instances
    (``auth``, ``db``, ``storage``, ``mail``) are created lazily on first access
    and share a single underlying HTTP session.

    Args:
        api_key (str): Project API key — use the publishable key
            (``pk_live_...``) for client-facing code and the secret key
            (``sk_live_...``) for server-side-only operations (mail, admin).
        base_url (str): Base URL of the urBackend public API.
            Defaults to ``"https://api.ub.bitbros.in"``.
        extra_headers (Optional[Dict[str, str]]): Additional HTTP headers
            merged into every request.

    Raises:
        ValueError: If ``api_key`` is empty.

    Example — Django / Flask server::

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

        # Storage
        with open("report.pdf", "rb") as f:
            result = client.storage.upload(f, filename="report.pdf")

        # Mail (secret key required)
        server_client = UrBackendClient(api_key="sk_live_YOUR_SECRET")
        server_client.mail.send(
            to="user@example.com",
            template_name="welcome",
            variables={"name": "Alice", "projectName": "Acme",
                       "appUrl": "https://acme.com"},
        )

    .. warning::
        Never expose a Secret Key (``sk_live_...``) in client-facing code.
        Use the Publishable Key (``pk_live_...``) instead.
    """

    @staticmethod
    def _validate_api_key(api_key: str) -> None:
        if not api_key:
            raise ValueError("api_key must not be empty.")

        if api_key.startswith("sk_live_"):
            warnings.warn(
                "⚠️  urbackend-sdk: You are initialising the client with a Secret "
                "Key (sk_live_...). Never use this in client-facing code — it grants "
                "full access to your project. Use the Publishable Key (pk_live_...) "
                "for end-user requests.",
                stacklevel=3,
            )

    def __init__(
        self,
        api_key: str,
        base_url: str = _DEFAULT_BASE_URL,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> None:
        self._validate_api_key(api_key)

        self._extra_headers = extra_headers
        self._http = UrBackendHTTP(
            api_key=api_key,
            base_url=base_url,
            extra_headers=self._extra_headers,
        )

        self._auth: Optional[AuthModule] = None
        self._db: Optional[DatabaseModule] = None
        self._storage: Optional[StorageModule] = None
        self._mail: Optional[MailModule] = None

    # ------------------------------------------------------------------
    # Module accessors (lazy init)
    # ------------------------------------------------------------------

    @property
    def auth(self) -> AuthModule:
        """Authentication module — sign-up, login, profile, social auth.

        Example:
            >>> session = client.auth.login("alice@example.com", "secret")
        """
        if self._auth is None:
            self._auth = AuthModule(self._http)
        return self._auth

    @property
    def db(self) -> DatabaseModule:
        """Database module — CRUD operations on MongoDB collections.

        Example:
            >>> posts = client.db.get_all("posts")
        """
        if self._db is None:
            self._db = DatabaseModule(self._http)
        return self._db

    @property
    def storage(self) -> StorageModule:
        """Storage module — file upload and deletion.

        Example:
            >>> result = client.storage.upload("/tmp/image.png")
        """
        if self._storage is None:
            self._storage = StorageModule(self._http)
        return self._storage

    @property
    def mail(self) -> MailModule:
        """Mail module — transactional email (requires Secret Key).

        Example:
            >>> client.mail.send(to="u@example.com", template_name="welcome",
            ...                  variables={"name": "Bob"})
        """
        if self._mail is None:
            self._mail = MailModule(self._http)
        return self._mail

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------

    def connect(
        self,
        api_key: str,
        base_url: str = _DEFAULT_BASE_URL,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> "UrBackendClient":
        """Re-initialise the client with a new API key / base URL.

        Useful for frameworks that prefer a two-step init pattern or for
        switching between projects at runtime.

        Args:
            api_key: New API key.
            base_url: New base URL.

        Returns:
            ``self`` for chaining.

        Example:
            >>> client = UrBackendClient(api_key="pk_live_old")
            >>> client.connect("pk_live_new")  # now uses new key
        """
        self._validate_api_key(api_key)

        # Replace the shared HTTP session
        self._http.close()
        merged = extra_headers if extra_headers is not None else self._extra_headers
        self._http = UrBackendHTTP(api_key=api_key, base_url=base_url, extra_headers=merged)
        self._extra_headers = merged
        # Reset lazy modules — they'll be recreated with the new http on next access
        self._auth = None
        self._db = None
        self._storage = None
        self._mail = None

        return self

    def close(self) -> None:
        """Release the underlying HTTP session.

        Call this when your application shuts down to free OS resources.

        Example:
            >>> client.close()
        """
        self._http.close()

    def __enter__(self) -> "UrBackendClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
