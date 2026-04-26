"""
urBackend Python SDK — Centralised HTTP request layer.

All modules route every API call through ``UrBackendHTTP.request``.  The
handler attaches the required headers (``x-api-key``, optional
``Authorization``), serialises the body, deserialises the response, and maps
non-2xx status codes to the appropriate SDK exception.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from urllib.parse import urlparse

import requests

from .exceptions import (
    AuthError,
    NotFoundError,
    RateLimitError,
    StorageError,
    UrBackendError,
    ValidationError,
)

_SDK_VERSION = "0.1.0"
_USER_AGENT = f"urbackend-sdk-python/{_SDK_VERSION}"


def _parse_api_error(response: requests.Response) -> UrBackendError:
    """Convert a non-2xx ``requests.Response`` into the correct SDK exception.

    Args:
        response: The raw HTTP response with a non-2xx status code.

    Returns:
        An ``UrBackendError`` subclass appropriate for the status code.
    """
    endpoint = urlparse(response.url).path
    message: str = "An unexpected error occurred"

    try:
        data: Any = response.json()
        if isinstance(data, dict):
            # standardizeApiResponse puts the message in "error" for 4xx/5xx;
            # some controllers also use "message" directly.
            message = (
                data.get("error")
                or data.get("message")
                or message
            )
    except (ValueError, KeyError):
        message = response.reason or message

    status = response.status_code

    if status in (401, 403):
        return AuthError(message, status, endpoint)
    if status == 404:
        return NotFoundError(message, endpoint)
    if status == 429:
        retry_after_raw = response.headers.get("Retry-After")
        retry_after: Optional[int] = None
        if retry_after_raw:
            try:
                retry_after = int(retry_after_raw)
            except ValueError:
                # HTTP-date form — convert to seconds-from-now if parseable, else ignore
                try:
                    from email.utils import parsedate_to_datetime
                    from datetime import datetime, timezone
                    target = parsedate_to_datetime(retry_after_raw)
                    delta = (target - datetime.now(timezone.utc)).total_seconds()
                    retry_after = max(0, int(delta))
                except (TypeError, ValueError):
                    retry_after = None
        return RateLimitError(message, endpoint, retry_after)
    if status == 400:
        return ValidationError(message, endpoint)
    if "/api/storage" in endpoint:
        return StorageError(message, status, endpoint)

    return UrBackendError(message, status, endpoint)


class UrBackendHTTP:
    """Low-level HTTP client shared by all SDK modules.

    Wraps ``requests.Session`` and handles:
    - Header injection (``x-api-key``, ``User-Agent``, ``Authorization``)
    - JSON serialisation / deserialisation
    - Transparent multipart (file upload) support
    - Error mapping from HTTP status codes → SDK exceptions

    Args:
        api_key (str): The project's publishable or secret API key.
        base_url (str): Root URL of the urBackend public API.
        extra_headers (Optional[Dict[str, str]]): Additional headers merged
            into every request.

    Example:
        >>> http = UrBackendHTTP(api_key="pk_live_xxx",
        ...                      base_url="https://api.ub.bitbros.in")
        >>> data = http.request("GET", "/api/data/products")
    """

    def __init__(
        self,
        api_key: str,
        base_url: str,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._extra_headers: Dict[str, str] = extra_headers or {}
        self._session = requests.Session()

    @property
    def api_key(self) -> str:
        return self._api_key

    @property
    def base_url(self) -> str:
        return self._base_url

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def request(
        self,
        method: str,
        path: str,
        *,
        token: Optional[str] = None,
        body: Optional[Any] = None,
        params: Optional[Dict[str, Any]] = None,
        files: Optional[Any] = None,
        extra_headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        """Send an HTTP request and return the parsed response payload.

        The API always wraps successful responses in::

            { "success": true, "data": <payload>, "message": "" }

        This method unwraps ``data`` automatically so callers receive the
        inner payload directly.

        Args:
            method: HTTP verb (``"GET"``, ``"POST"``, ``"PUT"``, etc.).
            path: API path relative to ``base_url`` (e.g. ``"/api/data/posts"``).
            token: Optional Bearer token. Adds ``Authorization: Bearer <token>``
                when supplied.
            body: Request payload. Serialised as JSON unless ``files`` is set.
            params: URL query parameters appended to the request URL.
            files: Multipart form data for file uploads
                (passed directly to ``requests``).
            extra_headers: Per-request headers merged on top of the defaults.

        Returns:
            The parsed ``data`` field from the API response, or the full JSON
            object when ``data`` is absent (e.g. logout / exchange endpoints).

        Raises:
            AuthError: HTTP 401 or 403.
            NotFoundError: HTTP 404.
            RateLimitError: HTTP 429.
            ValidationError: HTTP 400.
            StorageError: Storage endpoint error.
            UrBackendError: Any other non-2xx response or network failure.
        """
        url = f"{self._base_url}{path}"

        headers: Dict[str, str] = {
            "x-api-key": self._api_key,
            "User-Agent": _USER_AGENT,
            **self._extra_headers,
        }

        if token:
            headers["Authorization"] = f"Bearer {token}"

        if extra_headers:
            headers.update(extra_headers)

        json_body: Optional[Any] = None
        data_body: Optional[Any] = None

        if files:
            # Multipart — let requests set Content-Type with boundary
            data_body = body
        elif body is not None:
            headers["Content-Type"] = "application/json"
            json_body = body

        try:
            response = self._session.request(
                method=method.upper(),
                url=url,
                headers=headers,
                params=params,
                json=json_body,
                data=data_body,
                files=files,
            )
        except requests.RequestException as exc:
            raise UrBackendError(str(exc), 0, path) from exc

        if not response.ok:
            raise _parse_api_error(response)

        content_type = response.headers.get("Content-Type", "")
        if "application/json" in content_type:
            try:
                payload = response.json()
            except ValueError:
                return response.text

            # Unwrap { success, data, message } envelope only when it's clearly that shape
            if (
                isinstance(payload, dict)
                and payload.get("success") is True
                and "data" in payload
            ):
                return payload["data"]
            return payload

        return response.text

    def close(self) -> None:
        """Close the underlying ``requests.Session``.

        Call this when you are done with the client to release connections.

        Example:
            >>> http.close()
        """
        self._session.close()
