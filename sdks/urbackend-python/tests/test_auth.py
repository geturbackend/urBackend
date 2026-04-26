"""Tests for AuthModule — all HTTP calls mocked with 'responses'."""

import json

import pytest
import responses as rsps_lib

from urbackend.auth import AuthModule
from urbackend.exceptions import AuthError
from urbackend.http import UrBackendHTTP

BASE = "https://api.ub.bitbros.in"


@pytest.fixture
def http():
    return UrBackendHTTP(api_key="pk_live_test", base=BASE)


@pytest.fixture
def auth(http):
    return AuthModule(http)


class TestSignUp:
    @rsps_lib.activate
    def test_returns_user_on_success(self, auth):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/signup",
            json={"success": True, "data": {"_id": "abc123", "email": "bob@example.com"}, "message": ""},
            status=201,
        )
        user = auth.sign_up("bob@example.com", "p@ssw0rd", username="bob")
        assert user["_id"] == "abc123"
        assert user["email"] == "bob@example.com"

    @rsps_lib.activate
    def test_sends_extra_fields(self, auth):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/signup",
            json={"success": True, "data": {"_id": "x"}, "message": ""},
            status=201,
        )
        auth.sign_up("a@b.com", "pass", username="dev", preferences={"theme": "dark"})
        body = json.loads(rsps_lib.calls[0].request.body)
        assert body["preferences"] == {"theme": "dark"}


class TestLogin:
    @rsps_lib.activate
    def test_stores_access_token(self, auth):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/login",
            json={"success": True, "data": {"accessToken": "tok_abc", "expiresIn": 900}, "message": ""},
            status=200,
        )
        session = auth.login("alice@example.com", "secret")
        assert session["accessToken"] == "tok_abc"
        assert auth.get_token() == "tok_abc"

    @rsps_lib.activate
    def test_raises_auth_error_on_401(self, auth):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/login",
            json={"success": False, "message": "Invalid credentials"},
            status=401,
        )
        with pytest.raises(AuthError):
            auth.login("a@b.com", "wrong")


class TestMe:
    def test_raises_auth_error_without_token(self, auth):
        with pytest.raises(AuthError) as exc_info:
            auth.me()
        assert exc_info.value.status_code == 401

    @rsps_lib.activate
    def test_uses_stored_token(self, auth):
        auth.set_token("tok_stored")
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/userAuth/me",
            json={"success": True, "data": {"email": "a@b.com"}, "message": ""},
            status=200,
        )
        user = auth.me()
        assert user["email"] == "a@b.com"
        assert rsps_lib.calls[0].request.headers["Authorization"] == "Bearer tok_stored"

    @rsps_lib.activate
    def test_accepts_explicit_token(self, auth):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/userAuth/me",
            json={"success": True, "data": {"email": "b@c.com"}, "message": ""},
            status=200,
        )
        user = auth.me(token="explicit_token")
        assert rsps_lib.calls[0].request.headers["Authorization"] == "Bearer explicit_token"


class TestLogout:
    @rsps_lib.activate
    def test_clears_token_after_logout(self, auth):
        auth.set_token("tok_to_clear")
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/logout",
            json={"success": True, "message": "Logged out"},
            status=200,
        )
        auth.logout()
        assert auth.get_token() is None

    def test_logout_without_token_returns_locally(self, auth):
        result = auth.logout()
        assert result["success"] is True


class TestSocialAuth:
    def test_social_start_url_contains_key(self, auth):
        url = auth.social_start_url("github")
        assert "pk_live_test" in url
        assert "/api/userAuth/social/github/start" in url

    @rsps_lib.activate
    def test_social_exchange_posts_correctly(self, auth):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/social/exchange",
            json={"success": True, "data": {"refreshToken": "rt_abc"}, "message": ""},
            status=200,
        )
        result = auth.social_exchange("rt_code_abc", "one_time_tok")
        body = json.loads(rsps_lib.calls[0].request.body)
        assert body["rtCode"] == "rt_code_abc"
        assert body["token"] == "one_time_tok"
        assert result["refreshToken"] == "rt_abc"


class TestPasswordReset:
    @rsps_lib.activate
    def test_request_password_reset(self, auth):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/request-password-reset",
            json={"success": True, "data": {"message": "OTP sent"}, "message": ""},
            status=200,
        )
        auth.request_password_reset("alice@example.com")
        body = json.loads(rsps_lib.calls[0].request.body)
        assert body["email"] == "alice@example.com"

    @rsps_lib.activate
    def test_reset_password(self, auth):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/reset-password",
            json={"success": True, "data": {"message": "Reset ok"}, "message": ""},
            status=200,
        )
        auth.reset_password("alice@example.com", "123456", "N3wP@ss!")
        body = json.loads(rsps_lib.calls[0].request.body)
        assert body["otp"] == "123456"
        assert body["newPassword"] == "N3wP@ss!"


class TestTokenHelpers:
    def test_set_and_get_token(self, auth):
        assert auth.get_token() is None
        auth.set_token("manual_tok")
        assert auth.get_token() == "manual_tok"
