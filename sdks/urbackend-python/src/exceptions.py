"""
urBackend Python SDK — Custom exceptions.

All exceptions extend ``UrBackendError``, which carries the HTTP status code
and the endpoint path that triggered the error, mirroring the behaviour of the
official TypeScript SDK.
"""

from __future__ import annotations

from typing import Optional


class UrBackendError(Exception):
    """Base exception for all urBackend SDK errors.

    Attributes:
        message (str): Human-readable error description.
        status_code (int): HTTP status code returned by the API (0 for
            network-level errors).
        endpoint (str): API endpoint path that produced the error.

    Example:
        >>> try:
        ...     client.db.get_all("products")
        ... except UrBackendError as e:
        ...     print(e.status_code, e.message)
    """

    def __init__(self, message: str, status_code: int, endpoint: str) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.endpoint = endpoint

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"{self.__class__.__name__}("
            f"message={self.message!r}, "
            f"status_code={self.status_code}, "
            f"endpoint={self.endpoint!r})"
        )


class AuthError(UrBackendError):
    """Raised when the API returns HTTP 401 or 403.

    This typically means the API key is missing / invalid, the Bearer token has
    expired, or the user lacks RLS write permission.

    Example:
        >>> from urbackend import AuthError
        >>> try:
        ...     client.auth.me()
        ... except AuthError:
        ...     print("Please log in again.")
    """

    def __init__(self, message: str, status_code: int, endpoint: str) -> None:
        super().__init__(message, status_code, endpoint)


class NotFoundError(UrBackendError):
    """Raised when the API returns HTTP 404.

    Example:
        >>> from urbackend import NotFoundError
        >>> try:
        ...     client.db.get_one("products", "nonexistent_id")
        ... except NotFoundError:
        ...     print("Document not found.")
    """

    def __init__(self, message: str, endpoint: str) -> None:
        super().__init__(message, 404, endpoint)


class RateLimitError(UrBackendError):
    """Raised when the API returns HTTP 429 (Too Many Requests).

    Attributes:
        retry_after (Optional[int]): Seconds to wait before retrying, if
            provided by the server via the ``Retry-After`` header.

    Example:
        >>> from urbackend import RateLimitError
        >>> try:
        ...     client.db.get_all("logs")
        ... except RateLimitError as e:
        ...     print(f"Retry after {e.retry_after}s")
    """

    def __init__(
        self,
        message: str,
        endpoint: str,
        retry_after: Optional[int] = None,
    ) -> None:
        super().__init__(message, 429, endpoint)
        self.retry_after = retry_after


class ValidationError(UrBackendError):
    """Raised when the API returns HTTP 400 (Bad Request / Validation failure).

    Example:
        >>> from urbackend import ValidationError
        >>> try:
        ...     client.db.insert("orders", {})   # missing required fields
        ... except ValidationError as e:
        ...     print("Bad payload:", e.message)
    """

    def __init__(self, message: str, endpoint: str) -> None:
        super().__init__(message, 400, endpoint)


class StorageError(UrBackendError):
    """Raised when a storage-related endpoint returns an unexpected error.

    Example:
        >>> from urbackend import StorageError
        >>> try:
        ...     client.storage.delete_file("missing/path.pdf")
        ... except StorageError as e:
        ...     print("Storage error:", e.message)
    """

    def __init__(self, message: str, status_code: int, endpoint: str) -> None:
        super().__init__(message, status_code, endpoint)
