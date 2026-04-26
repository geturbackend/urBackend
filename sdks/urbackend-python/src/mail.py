"""
urBackend Python SDK — Mail module (server-side only).

Requires a Secret Key (``sk_live_...``). Never use this from client-facing code.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

from .http import UrBackendHTTP


class MailModule:
    """Handles ``/api/mail/send`` (server-side only).

    Requires a Secret Key (``sk_live_...``).

    Args:
        http: Shared :class:`~urbackend.http.UrBackendHTTP` instance.

    Example:
        >>> server_client = UrBackendClient(api_key="sk_live_xxx")
        >>> server_client.mail.send(
        ...     to="user@example.com",
        ...     template_name="welcome",
        ...     variables={"name": "Alice", "projectName": "Acme",
        ...                 "appUrl": "https://acme.com"},
        ... )
    """

    def __init__(self, http: UrBackendHTTP) -> None:
        self._http = http

    def send(
        self,
        to: Union[str, List[str]],
        *,
        template_name: Optional[str] = None,
        template_id: Optional[str] = None,
        variables: Optional[Dict[str, Any]] = None,
        subject: Optional[str] = None,
        text: Optional[str] = None,
        html: Optional[str] = None,
        from_address: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Send a transactional email via urBackend.

        Use either a ``template_name``/``template_id`` (recommended) or raw
        ``subject`` + at least one of ``text`` / ``html``.

        Args:
            to: Recipient email address or list of addresses.
            template_name: Named template slug — e.g. ``"welcome"``, ``"otp"``,
                ``"password-reset"``, ``"invite"``, ``"welcome-2"``.
            template_id: Template ObjectId (alternative to ``template_name``).
            variables: Template variable substitutions, e.g.
                ``{"name": "Alice", "projectName": "Acme", "appUrl": "..."}``.
            subject: Email subject (used when not using a template).
            text: Plain-text body (used when not using a template).
            html: HTML body (used when not using a template).
            from_address: Override sender address.
            cc: List of CC recipient addresses.
            bcc: List of BCC recipient addresses.

        Returns:
            Dict with ``id``, ``provider``, ``monthlyUsage``, and
            ``monthlyLimit`` keys.

        Raises:
            AuthError: Secret key missing or invalid.
            ValidationError: Payload validation failed.
            RateLimitError: Monthly email quota exceeded.

        Example:
            >>> result = client.mail.send(
            ...     to="new_user@example.com",
            ...     template_name="welcome",
            ...     variables={
            ...         "name": "Bob",
            ...         "projectName": "MyApp",
            ...         "appUrl": "https://myapp.com",
            ...     },
            ... )
            >>> print(result.get("id"))
        """
        payload: Dict[str, Any] = {"to": to}

        if template_name is not None:
            payload["templateName"] = template_name
        if template_id is not None:
            payload["templateId"] = template_id
        if variables is not None:
            payload["variables"] = variables
        if subject is not None:
            payload["subject"] = subject
        if text is not None:
            payload["text"] = text
        if html is not None:
            payload["html"] = html
        if from_address is not None:
            payload["from"] = from_address
        if cc is not None:
            payload["cc"] = cc
        if bcc is not None:
            payload["bcc"] = bcc

        return self._http.request("POST", "/api/mail/send", body=payload)
