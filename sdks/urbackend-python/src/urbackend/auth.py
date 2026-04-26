"""
urBackend Python SDK — Authentication module.

Mirrors ``AuthModule`` from the TypeScript SDK.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
import warnings

from .exceptions import AuthError, UrBackendError
from .http import UrBackendHTTP

class AuthModule:
    """Handles all ``/api/userAuth/*`` operations.

    Args:
        http: Shared :class:`~urbackend.http.UrBackendHTTP` instance.

    Example:
        >>> session = client.auth.login("alice@example.com", "secret123")
        >>> print(session["accessToken"])
    """

    def __init__(self, http: UrBackendHTTP) -> None:
        self._http = http
        self._session_token: Optional[str] = None

    # ------------------------------------------------------------------
    # Registration & Login
    # ------------------------------------------------------------------

    def sign_up(
        self,
        email: str,
        password: str,
        username: Optional[str] = None,
        **extra_fields: Any,
    ) -> Dict[str, Any]:
        """Create a new user account.

        Args:
            email: User's email address.
            password: Plaintext password (hashed server-side).
            username: Optional username.
            **extra_fields: Additional schema fields (e.g. ``preferences``).

        Returns:
            The newly created user document (password omitted).

        Raises:
            ValidationError: Missing or invalid fields.
            AuthError: Email already registered.

        Example:
            >>> user = client.auth.sign_up(
            ...     email="bob@example.com",
            ...     password="Sup3rS3cure!",
            ...     username="bob_dev",
            ... )
            >>> print(user["_id"])
        """
        payload: Dict[str, Any] = {"email": email, "password": password}
        if username is not None:
            payload["username"] = username
        payload.update(extra_fields)
        return self._http.request("POST", "/api/userAuth/signup", body=payload)

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate an existing user and cache the access token internally.

        After a successful login the ``accessToken`` is stored and reused
        automatically by methods that require auth (``me``, ``logout``, etc.).

        Args:
            email: User's email address.
            password: User's password.

        Returns:
            Dict with ``accessToken`` and ``expiresIn``.

        Raises:
            AuthError: Wrong credentials or locked account.

        Example:
            >>> session = client.auth.login("alice@example.com", "secret123")
            >>> print(session["accessToken"])
        """
        response: Dict[str, Any] = self._http.request(
            "POST",
            "/api/userAuth/login",
            body={"email": email, "password": password},
        )
        self._session_token = response.get("accessToken") or response.get("token")
        return response

    # ------------------------------------------------------------------
    # Session helpers
    # ------------------------------------------------------------------

    def me(self, token: Optional[str] = None) -> Dict[str, Any]:
        """Fetch the current authenticated user's profile.

        Args:
            token: Bearer token; falls back to the stored session token.

        Returns:
            User profile dict (sensitive fields omitted).

        Raises:
            AuthError: No token available or token expired.

        Example:
            >>> user = client.auth.me()
            >>> print(user["email"])
        """
        active_token = token or self._session_token
        if not active_token:
            raise AuthError(
                "Authentication token is required for /me endpoint",
                401,
                "/api/userAuth/me",
            )
        return self._http.request("GET", "/api/userAuth/me", token=active_token)

    def logout(self, token: Optional[str] = None) -> Dict[str, Any]:
        """Revoke the current session and clear the local token.

        Server errors are swallowed so the local state is always cleaned up.

        Args:
            token: Bearer token; falls back to the stored session token.

        Returns:
            ``{"success": True, "message": "..."}``

        Example:
            >>> client.auth.logout()
        """
        active_token = token or self._session_token
        result: Dict[str, Any] = {"success": True, "message": "Logged out locally"}
        if active_token:
            try:
                result = self._http.request(
                    "POST", "/api/userAuth/logout", token=active_token
                )
            except UrBackendError as exc:
                warnings.warn(
                    f"urbackend-sdk: server logout failed ({exc}); cleared local token only.",
                    stacklevel=2,
                )
        self._session_token = None
        return result

    def refresh_token(self, refresh_token: Optional[str] = None) -> Dict[str, Any]:
        """Obtain a fresh access token using a refresh token.

        Args:
            refresh_token: Stored refresh token string (header-mode). Omit to
                rely on cookies managed externally.

        Returns:
            Dict with a new ``accessToken``.

        Raises:
            AuthError: Refresh token invalid or expired.

        Example:
            >>> new_session = client.auth.refresh_token(stored_rt)
            >>> client.auth.set_token(new_session["accessToken"])
        """
        extra_headers: Optional[Dict[str, str]] = None
        if refresh_token:
            extra_headers = {
                "x-refresh-token": refresh_token,
                "x-refresh-token-mode": "header",
            }
        response: Dict[str, Any] = self._http.request(
            "POST",
            "/api/userAuth/refresh-token",
            extra_headers=extra_headers,
        )
        self._session_token = response.get("accessToken") or response.get("token")
        return response

    # ------------------------------------------------------------------
    # Profile management
    # ------------------------------------------------------------------

    def update_profile(
        self, payload: Dict[str, Any], token: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update the current user's profile fields.

        Args:
            payload: Fields to update, e.g. ``{"username": "new_name"}``.
            token: Bearer token; falls back to stored session token.

        Returns:
            ``{"message": "Profile updated"}``

        Raises:
            AuthError: Not authenticated.

        Example:
            >>> client.auth.update_profile({"username": "alice_v2"})
        """
        active_token = token or self._session_token
        if not active_token:
            raise AuthError(
                "Authentication token is required to update profile",
                401,
                "/api/userAuth/update-profile",
            )
        return self._http.request(
            "PUT",
            "/api/userAuth/update-profile",
            token=active_token,
            body=payload,
        )

    def change_password(
        self,
        current_password: str,
        new_password: str,
        token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Change the current user's password.

        Args:
            current_password: Existing password.
            new_password: Desired new password.
            token: Bearer token; falls back to stored session token.

        Returns:
            ``{"message": "Password changed"}``

        Raises:
            AuthError: Not authenticated or wrong current password.

        Example:
            >>> client.auth.change_password("OldP@ss", "N3wP@ss!")
        """
        active_token = token or self._session_token
        if not active_token:
            raise AuthError(
                "Authentication token is required to change password",
                401,
                "/api/userAuth/change-password",
            )
        return self._http.request(
            "PUT",
            "/api/userAuth/change-password",
            token=active_token,
            body={"currentPassword": current_password, "newPassword": new_password},
        )

    def public_profile(self, username: str) -> Dict[str, Any]:
        """Fetch a public user profile by username (no auth required).

        Args:
            username: Target user's username.

        Returns:
            Public profile dict (no email/password).

        Raises:
            NotFoundError: Username not found.

        Example:
            >>> profile = client.auth.public_profile("bob_dev")
        """
        return self._http.request("GET", f"/api/userAuth/public/{username}")

    # ------------------------------------------------------------------
    # Email verification
    # ------------------------------------------------------------------

    def verify_email(self, email: str, otp: str) -> Dict[str, Any]:
        """Verify a user's email with a one-time password.

        Args:
            email: Email address to verify.
            otp: 6-digit OTP from the verification email.

        Returns:
            ``{"message": "Email verified"}``

        Raises:
            AuthError: OTP invalid or expired.

        Example:
            >>> client.auth.verify_email("alice@example.com", "123456")
        """
        return self._http.request(
            "POST",
            "/api/userAuth/verify-email",
            body={"email": email, "otp": otp},
        )

    def resend_verification_otp(self, email: str) -> Dict[str, Any]:
        """Request a new email-verification OTP.

        Args:
            email: Email address that needs re-verification.

        Returns:
            ``{"message": "OTP sent"}``

        Raises:
            RateLimitError: Too many resend attempts.

        Example:
            >>> client.auth.resend_verification_otp("alice@example.com")
        """
        return self._http.request(
            "POST",
            "/api/userAuth/resend-verification-otp",
            body={"email": email},
        )

    # ------------------------------------------------------------------
    # Password reset
    # ------------------------------------------------------------------

    def request_password_reset(self, email: str) -> Dict[str, Any]:
        """Send a password-reset OTP to the given email.

        Args:
            email: Account email address.

        Returns:
            ``{"message": "Reset OTP sent"}``

        Raises:
            NotFoundError: No account with that email.

        Example:
            >>> client.auth.request_password_reset("alice@example.com")
        """
        return self._http.request(
            "POST",
            "/api/userAuth/request-password-reset",
            body={"email": email},
        )

    def reset_password(
        self, email: str, otp: str, new_password: str
    ) -> Dict[str, Any]:
        """Reset a password using a valid OTP.

        Args:
            email: Account email address.
            otp: OTP received via email.
            new_password: Desired new password.

        Returns:
            ``{"message": "Password reset successfully"}``

        Raises:
            AuthError: OTP invalid or expired.

        Example:
            >>> client.auth.reset_password("alice@example.com", "654321",
            ...                            "N3wP@ssw0rd!")
        """
        return self._http.request(
            "POST",
            "/api/userAuth/reset-password",
            body={"email": email, "otp": otp, "newPassword": new_password},
        )

    # ------------------------------------------------------------------
    # Social auth
    # ------------------------------------------------------------------

    def social_start_url(self, provider: str) -> str:
        """Return the OAuth redirect URL for the given social provider.

        Redirect the end-user's browser to this URL to begin the OAuth flow.

        Args:
            provider: ``"github"`` or ``"google"``.

        Returns:
            Full OAuth start URL as a string.

        Example:
            >>> url = client.auth.social_start_url("github")
            >>> return redirect(url)   # Django redirect
        """
        base = self._http.base
        api_key = self._http.api_key
        if api_key.startswith("sk_live_"):
            raise ValueError(
                "social_start_url must not be called with a Secret Key (sk_live_...). "
                "Use the Publishable Key (pk_live_...) for browser redirects."
            )
        return f"{base}/api/userAuth/social/{provider}/start?key={api_key}"

    def social_exchange(self, rt_code: str, token: str) -> Dict[str, Any]:
        """Exchange an OAuth ``rtCode`` + one-time ``token`` for a urBackend refresh token.

        Both ``rtCode`` and ``token`` are returned as query parameters on the
        OAuth callback URL (``<siteUrl>/auth/callback?rtCode=...&token=...``).

        Args:
            rt_code: The ``rtCode`` query parameter from the OAuth callback URL.
            token: The one-time security ``token`` query parameter from the callback URL.

        Returns:
            Dict with ``refreshToken`` that can be used with :meth:`refresh_token`.

        Raises:
            AuthError: ``rtCode`` or ``token`` invalid or expired.

        Example:
            >>> # In a Django callback view:
            >>> rt_code = request.GET.get("rtCode")
            >>> token   = request.GET.get("token")
            >>> session = client.auth.social_exchange(rt_code, token)
            >>> # Now call refresh_token to get an accessToken:
            >>> new_session = client.auth.refresh_token(session["refreshToken"])
            >>> client.auth.set_token(new_session["accessToken"])
        """
        return self._http.request(
            "POST",
            "/api/userAuth/social/exchange",
            body={"rtCode": rt_code, "token": token},
        )

    # ------------------------------------------------------------------
    # Token utilities
    # ------------------------------------------------------------------

    def set_token(self, token: str) -> None:
        """Manually set the stored session token.

        Useful after restoring a session from a database or Django session.

        Args:
            token: A valid ``accessToken`` string.

        Example:
            >>> client.auth.set_token(request.session["access_token"])
        """
        self._session_token = token

    def get_token(self) -> Optional[str]:
        """Return the currently stored session token, or ``None``.

        Example:
            >>> token = client.auth.get_token()
        """
        return self._session_token
