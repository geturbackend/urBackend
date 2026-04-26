"""Tests for DatabaseModule — all HTTP calls mocked with 'responses'."""

import json
import pytest
import responses as rsps_lib

from urbackend.db import CollectionRef, DatabaseModule
from urbackend.exceptions import AuthError, NotFoundError
from urbackend.http import UrBackendHTTP

BASE = "https://api.ub.bitbros.in"


@pytest.fixture
def http():
    return UrBackendHTTP(api_key="pk_live_test", base=BASE)


@pytest.fixture
def db(http):
    return DatabaseModule(http)


class TestGetAll:
    @rsps_lib.activate
    def test_returns_list_on_success(self, db):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/posts",
            json={"success": True, "data": {"items": [{"_id": "1"}, {"_id": "2"}], "total": 2, "page": 1, "limit": 50}, "message": ""},
            status=200,
        )
        result = db.get_all("posts")
        assert len(result) == 2
        assert result[0]["_id"] == "1"

    @rsps_lib.activate
    def test_returns_empty_list_on_404(self, db):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/posts",
            json={"success": False, "message": "Not found"},
            status=404,
        )
        result = db.get_all("posts")
        assert result == []

    @rsps_lib.activate
    def test_filter_params_sent_as_query_string(self, db):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/products",
            json={"success": True, "data": {"items": [], "total": 0, "page": 1, "limit": 10}, "message": ""},
            status=200,
        )
        db.get_all("products", filter={"status": "active"}, limit=10, sort="price:asc")
        url = rsps_lib.calls[0].request.url
        assert "status=active" in url
        assert "limit=10" in url
        assert "sort=price%3Aasc" in url or "sort=price:asc" in url

    @rsps_lib.activate
    def test_populate_list_joined_with_comma(self, db):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/orders",
            json={"success": True, "data": {"items": [], "total": 0, "page": 1, "limit": 50}, "message": ""},
            status=200,
        )
        db.get_all("orders", populate=["user", "product"])
        url = rsps_lib.calls[0].request.url
        assert "populate=user%2Cproduct" in url or "populate=user,product" in url


class TestGetOne:
    @rsps_lib.activate
    def test_returns_document(self, db):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/posts/abc",
            json={"success": True, "data": {"_id": "abc", "title": "Hello"}, "message": ""},
            status=200,
        )
        doc = db.get_one("posts", "abc")
        assert doc["_id"] == "abc"
        assert doc["title"] == "Hello"

    @rsps_lib.activate
    def test_raises_not_found(self, db):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/posts/bad",
            json={"success": False, "message": "Not found"},
            status=404,
        )
        with pytest.raises(NotFoundError):
            db.get_one("posts", "bad")


class TestInsert:
    @rsps_lib.activate
    def test_returns_created_document(self, db):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/data/posts",
            json={"success": True, "data": {"_id": "new1", "title": "New Post"}, "message": ""},
            status=201,
        )
        doc = db.insert("posts", {"title": "New Post"})
        assert doc["_id"] == "new1"

    @rsps_lib.activate
    def test_sends_token_header(self, db):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/data/posts",
            json={"success": True, "data": {"_id": "x"}, "message": ""},
            status=201,
        )
        db.insert("posts", {"title": "T"}, token="user_tok")
        assert rsps_lib.calls[0].request.headers["Authorization"] == "Bearer user_tok"


class TestUpdate:
    @rsps_lib.activate
    def test_returns_updated_document(self, db):
        rsps_lib.add(
            rsps_lib.PUT,
            f"{BASE}/api/data/posts/abc",
            json={"success": True, "data": {"_id": "abc", "title": "Updated"}, "message": ""},
            status=200,
        )
        doc = db.update("posts", "abc", {"title": "Updated"})
        assert doc["title"] == "Updated"


class TestPatch:
    @rsps_lib.activate
    def test_partial_update(self, db):
        rsps_lib.add(
            rsps_lib.PATCH,
            f"{BASE}/api/data/products/p1",
            json={"success": True, "data": {"_id": "p1", "price": 39.99}, "message": ""},
            status=200,
        )
        doc = db.patch("products", "p1", {"price": 39.99})
        assert doc["price"] == 39.99
        body = json.loads(rsps_lib.calls[0].request.body)
        assert "price" in body


class TestDelete:
    @rsps_lib.activate
    def test_returns_deleted_true(self, db):
        rsps_lib.add(
            rsps_lib.DELETE,
            f"{BASE}/api/data/posts/abc",
            json={"success": True, "data": {"id": "abc", "message": "Document deleted"}, "message": ""},
            status=200,
        )
        result = db.delete("posts", "abc")
        assert result["deleted"] is True


class TestCollectionRef:
    def test_collection_returns_ref(self, db):
        ref = db.collection("posts")
        assert isinstance(ref, CollectionRef)

    @rsps_lib.activate
    def test_ref_find_calls_get_all(self, db):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/posts",
            json={"success": True, "data": {"items": [{"_id": "1"}], "total": 1, "page": 1, "limit": 50}, "message": ""},
            status=200,
        )
        result = db.collection("posts").find({"status": "published"})
        assert len(result) == 1
        assert "status=published" in rsps_lib.calls[0].request.url

    @rsps_lib.activate
    def test_ref_insert_calls_insert(self, db):
        rsps_lib.add(
            rsps_lib.POST,
            f"{BASE}/api/data/comments",
            json={"success": True, "data": {"_id": "c1"}, "message": ""},
            status=201,
        )
        doc = db.collection("comments").insert({"body": "Hello"})
        assert doc["_id"] == "c1"


class TestCount:
    @rsps_lib.activate
    def test_returns_count_integer(self, db):
        rsps_lib.add(
            rsps_lib.GET,
            f"{BASE}/api/data/orders",
            json={"success": True, "data": {"count": 42}, "message": ""},
            status=200,
        )
        total = db.count("orders")
        assert total == 42
        assert "count=true" in rsps_lib.calls[0].request.url
