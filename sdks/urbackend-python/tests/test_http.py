"""Tests for UrBackendHTTP — mocked with the 'responses' library."""

import pytest
import responses as rsps_lib

from urbackend.exceptions import (
    AuthError,
    NotFoundError,
    RateLimitError,
    UrBackendError,
    ValidationError,
)
from urbackend.http import UrBackendHTTP

BASE = "https://api.ub.bitbros.in"


@pytest.fixture
def http():
    return UrBackendHTTP(api_key="pk_live_test", base=BASE)


class TestRequestSuccess:
    @rsps_lib.activate
    def test_unwraps_data_envelope(self, http):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/posts",
            json={"success": True, "data": [{"_id": "1", "title": "Hello"}], "message": ""},
            status=200,
        )
        result = http.request("GET", "/api/data/posts")
        assert result == [{"_id": "1", "title": "Hello"}]

    @rsps_lib.activate
    def test_returns_full_json_when_no_data_key(self, http):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/userAuth/logout",
            json={"success": True, "message": "Logged out"},
            status=200,
        )
        result = http.request("POST", "/api/userAuth/logout")
        assert result["success"] is True

    @rsps_lib.activate
    def test_sends_api_key_header(self, http):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/products",
            json={"success": True, "data": [], "message": ""},
            status=200,
        )
        http.request("GET", "/api/data/products")
        assert rsps_lib.calls[0].request.headers["x-api-key"] == "pk_live_test"

    @rsps_lib.activate
    def test_sends_bearer_token_when_provided(self, http):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/userAuth/me",
            json={"success": True, "data": {"email": "a@b.com"}, "message": ""},
            status=200,
        )
        http.request("GET", "/api/userAuth/me", token="my_token")
        assert rsps_lib.calls[0].request.headers["Authorization"] == "Bearer my_token"


class TestRequestErrors:
    @rsps_lib.activate
    def test_401_raises_auth_error(self, http):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/userAuth/me",
            json={"success": False, "message": "Unauthorized"},
            status=401,
        )
        with pytest.raises(AuthError) as exc_info:
            http.request("GET", "/api/userAuth/me")
        assert exc_info.value.status_code == 401

    @rsps_lib.activate
    def test_404_raises_not_found(self, http):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/posts/bad_id",
            json={"success": False, "message": "Not found"},
            status=404,
        )
        with pytest.raises(NotFoundError):
            http.request("GET", "/api/data/posts/bad_id")

    @rsps_lib.activate
    def test_429_raises_rate_limit(self, http):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/logs",
            json={"success": False, "message": "Rate limited"},
            status=429,
            headers={"Retry-After": "60"},
        )
        with pytest.raises(RateLimitError) as exc_info:
            http.request("GET", "/api/data/logs")
        assert exc_info.value.retry_after == 60

    @rsps_lib.activate
    def test_400_raises_validation_error(self, http):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/data/orders",
            json={"success": False, "message": "Validation failed"},
            status=400,
        )
        with pytest.raises(ValidationError):
            http.request("POST", "/api/data/orders", body={})

    @rsps_lib.activate
    def test_500_raises_urbackend_error(self, http):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/things",
            json={"success": False, "message": "Internal server error"},
            status=500,
        )
        with pytest.raises(UrBackendError) as exc_info:
            http.request("GET", "/api/data/things")
        assert exc_info.value.status_code == 500
