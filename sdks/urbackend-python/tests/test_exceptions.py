"""Tests for urbackend exceptions hierarchy."""

import pytest

from urbackend.exceptions import (
    AuthError,
    NotFoundError,
    RateLimitError,
    StorageError,
    UrBackendError,
    ValidationError,
)


class TestExceptionHierarchy:
    def test_urbackend_error_is_exception(self):
        err = UrBackendError("boom", 500, "/api/data/posts")
        assert isinstance(err, Exception)
        assert err.status_code == 500
        assert err.endpoint == "/api/data/posts"
        assert str(err) == "boom"

    def test_auth_error_inherits(self):
        err = AuthError("forbidden", 403, "/api/userAuth/me")
        assert isinstance(err, UrBackendError)
        assert err.status_code == 403

    def test_not_found_error_status(self):
        err = NotFoundError("not found", "/api/data/posts/999")
        assert err.status_code == 404

    def test_rate_limit_error_retry_after(self):
        err = RateLimitError("too many requests", "/api/data/logs", retry_after=30)
        assert err.status_code == 429
        assert err.retry_after == 30

    def test_rate_limit_error_no_retry_after(self):
        err = RateLimitError("too many", "/api/data/x")
        assert err.retry_after is None

    def test_validation_error_status(self):
        err = ValidationError("bad request", "/api/data/orders")
        assert err.status_code == 400

    def test_storage_error_inherits(self):
        err = StorageError("upload failed", 503, "/api/storage/upload-request")
        assert isinstance(err, UrBackendError)
        assert err.status_code == 503
