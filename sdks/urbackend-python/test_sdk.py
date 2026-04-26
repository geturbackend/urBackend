"""
urBackend Python SDK - Live Integration Test Script.

This script verifies the SDK works against a real urBackend instance.

BEFORE RUNNING:
1. Replace API_KEY with your real pk_live_... key from the dashboard
2. Replace COLLECTION with a collection that exists in your project
3. Ensure auth is enabled and a test user exists (or sign_up will create one)

Usage:
    cd sdks/urbackend-python
    pip install -e .
    python test_sdk.py
"""

import sys
import os
from dotenv import load_dotenv
load_dotenv()

# Ensure we import the local SDK, not any installed version
sys.path.insert(0, os.path.dirname(__file__))

from urbackend import UrBackendClient, AuthError, NotFoundError, ValidationError

# ────────────────────────────────────────────────────────────────
#  CONFIG - Replace these with your actual values
# ────────────────────────────────────────────────────────────────
API_KEY    = os.environ.get("URBACKEND_API_KEY")
BASE_URL   = os.environ.get("URBACKEND_BASE_URL", "https://api.ub.bitbros.in")
EMAIL      = os.environ.get("URBACKEND_TEST_EMAIL")
PASSWORD   = os.environ.get("URBACKEND_TEST_PASSWORD")
COLLECTION = os.environ.get("URBACKEND_TEST_COLLECTION", "posts")

missing = [k for k, v in {
    "URBACKEND_API_KEY": API_KEY,
    "URBACKEND_TEST_EMAIL": EMAIL,
    "URBACKEND_TEST_PASSWORD": PASSWORD,
}.items() if not v]
if missing:
    sys.exit(f"Missing required env vars: {', '.join(missing)}")


def separator(title: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")


def main():
    # ── 1. CONNECT ──────────────────────────────────────────────
    separator("1. Connect")
    client = UrBackendClient(api_key=API_KEY)
    print("Client created with default base URL")
    print(f"   api_key starts with: {API_KEY[:12]}...")

    # ── 2. SIGN UP (idempotent - may already exist) ─────────────
    separator("2. Sign Up")
    try:
        result = client.auth.sign_up(EMAIL, PASSWORD, username="sdk_tester")
        print(f"Signed up: {result}")
    except (AuthError, ValidationError) as e:
        print(f"Sign-up skipped (user likely exists): {e.message}")

    # ── 3. LOGIN ────────────────────────────────────────────────
    separator("3. Login")
    try:
        session = client.auth.login(EMAIL, PASSWORD)
        print("Login successful!")
        print(f"   accessToken: {session.get('accessToken', 'N/A')[:40]}...")
        print(f"   expiresIn:   {session.get('expiresIn', 'N/A')}")
    except AuthError as e:
        print(f"Login failed: {e.message}")
        print("   Cannot continue without login. Exiting.")
        sys.exit(1)

    # ── 4. TOKEN AUTO-STORAGE ───────────────────────────────────
    separator("4. Token Auto-Storage")
    stored_token = client.auth.get_token()
    if stored_token:
        print(f"Token auto-stored after login: {stored_token[:40]}...")
    else:
        print("Token NOT stored - this is a bug!")
        sys.exit(1)

    # ── 5. GET CURRENT USER (ME) ────────────────────────────────
    separator("5. Get Current User (/me)")
    try:
        me = client.auth.me()  # no token arg needed - auto-uses stored token
        print(f"Current user: {me.get('email', 'N/A')}")
        print(f"_id: {me.get('_id', 'N/A')}")
    except AuthError as e:
        print(f"/me failed: {e.message}")

    # ── 6. INSERT DOCUMENT ──────────────────────────────────────
    separator("6. Insert Document")
    try:
        doc = client.db.insert(
            COLLECTION,
            {"title": "SDK Test Post", "content": "Created by Python SDK test_sdk.py"},
            token=client.auth.get_token(),
        )
        doc_id = doc.get("_id")
        print(f"Inserted document: _id={doc_id}")
        print(f"   Full response: {doc}")
    except Exception as e:
        print(f"Insert failed: {e}")
        doc_id = None

    # ── 7. FETCH ALL DOCUMENTS ──────────────────────────────────
    separator("7. Fetch All Documents (get_all)")
    try:
        all_docs = client.db.get_all(COLLECTION, limit=5, sort="createdAt:desc")
        print(f"Fetched {len(all_docs)} documents")
        for i, d in enumerate(all_docs[:3]):
            print(f"   [{i}] _id={d.get('_id')}, title={d.get('title', 'N/A')}")
    except Exception as e:
        print(f"get_all failed: {e}")

    # ── 8. CHAINABLE COLLECTION API ─────────────────────────────
    separator("8. Chainable Collection API (find)")
    try:
        results = client.db.collection(COLLECTION).find(
            {"title": "SDK Test Post"}, limit=5
        )
        print(f"collection().find() returned {len(results)} docs")
    except Exception as e:
        print(f"collection().find() failed: {e}")

    # ── 9. GET ONE DOCUMENT ─────────────────────────────────────
    if doc_id:
        separator("9. Get One Document")
        try:
            single = client.db.get_one(COLLECTION, doc_id)
            print(f"get_one returned: title={single.get('title')}")
        except NotFoundError:
            print(f"Document {doc_id} not found")
        except Exception as e:
            print(f"get_one failed: {e}")

    # ── 10. PATCH DOCUMENT ──────────────────────────────────────
    if doc_id:
        separator("10. Patch Document")
        try:
            patched = client.db.patch(
                COLLECTION, doc_id,
                {"title": "SDK Test Post - PATCHED"},
                token=client.auth.get_token(),
            )
            print(f"Patched: title={patched.get('title')}")
        except Exception as e:
            print(f"Patch failed: {e}")

    # ── 11. DELETE DOCUMENT ─────────────────────────────────────
    if doc_id:
        separator("11. Delete Document")
        try:
            del_result = client.db.delete(
                COLLECTION, doc_id,
                token=client.auth.get_token(),
            )
            print(f"Deleted: {del_result}")
        except Exception as e:
            print(f"Delete failed: {e}")

    # ── 12. COUNT DOCUMENTS ─────────────────────────────────────
    separator("12. Count Documents")
    try:
        total = client.db.count(COLLECTION)
        print(f"Total documents in '{COLLECTION}': {total}")
    except Exception as e:
        print(f"Count failed: {e}")

    # ── 13. EDGE CASE: INVALID LOGIN ────────────────────────────
    separator("13. Edge Case: Invalid Login")
    try:
        client.auth.login("nonexistent@example.com", "wrongpassword")
        print("Should have raised AuthError!")
    except AuthError as e:
        print(f"Correctly raised AuthError: {e.message}")
    except Exception as e:
        print(f"Unexpected error type: {type(e).__name__}: {e}")

    # ── 14. EDGE CASE: MISSING TOKEN ────────────────────────────
    separator("14. Edge Case: Missing Token (me without login)")
    fresh_client = UrBackendClient(api_key=API_KEY, base=BASE_URL)
    try:
        fresh_client.auth.me()
        print("Should have raised AuthError!")
    except AuthError as e:
        print(f"Correctly raised AuthError: {e.message}")

    # ── 15. EDGE CASE: EMPTY QUERY ──────────────────────────────
    separator("15. Edge Case: Empty Collection Query")
    try:
        empty_results = client.db.get_all("nonexistent_collection_xyz")
        print(f"Empty collection returns: {empty_results} (type={type(empty_results).__name__})")
    except Exception as e:
        print(f"   Raised: {type(e).__name__}: {e}")

    # ══════════════════════════════════════════════════════════════
    #  ENHANCED TESTS - Negative, Query, Token, Error, Edge Cases
    # ══════════════════════════════════════════════════════════════

    # ── 16. NEGATIVE: INSERT WITHOUT LOGIN ──────────────────────
    separator("16. Negative: Insert Without Login (fresh client)")
    try:
        with UrBackendClient(api_key=API_KEY, base=BASE_URL) as no_auth_client:
            no_auth_client.db.insert(
                COLLECTION,
                {"title": "Should Fail", "content": "No auth token"},
                # deliberately NOT passing token
            )
        print("Insert succeeded without auth - expected 401/403!")
    except AuthError as e:
        print(f"Correctly blocked (AuthError): {e.message}")
        print(f"   Status code: {e.status_code}")
    except Exception as e:
        print(f"Blocked with {type(e).__name__}: {e}")
        print("   (May be expected if RLS is not enabled - insert went through without owner)")

    # ── 17. NEGATIVE: PROTECTED ENDPOINT WITHOUT TOKEN ──────────
    separator("17. Negative: /me Without Token")
    with UrBackendClient(api_key=API_KEY, base=BASE_URL) as no_auth_client2:
        try:
            no_auth_client2.auth.me()
            print("/me succeeded without token - expected AuthError!")
        except AuthError as e:
            print(f"Correctly raised AuthError: {e.message}")
            print(f"   Status code: {e.status_code}")

    # ── 18. NEGATIVE: WRITE TO INVALID COLLECTION ───────────────
    separator("18. Negative: Insert Into Non-Existent Collection")
    try:
        client.db.insert(
            "this_collection_does_not_exist_xyz",
            {"title": "Ghost"},
            token=client.auth.get_token(),
        )
        print("Insert to non-existent collection succeeded - unexpected!")
    except NotFoundError as e:
        print(f"Correctly raised NotFoundError: {e.message}")
    except ValidationError as e:
        print(f"Correctly raised ValidationError: {e.message}")
    except Exception as e:
        print(f"Raised {type(e).__name__}: {e}")
        print("   (Still handled - the SDK didn't crash)")

    # ── 19. QUERY: LIMIT, SORT, FILTER ──────────────────────────
    separator("19. Query Params: limit, sort, filter")

    # 19a. Limit
    try:
        limited = client.db.get_all(COLLECTION, limit=1)
        print(f"limit=1 returned {len(limited)} doc(s)")
        assert len(limited) <= 1, "Limit not respected!"
    except Exception as e:
        print(f"limit query failed: {e}")

    # 19b. Sort
    try:
        sorted_asc = client.db.get_all(COLLECTION, limit=2, sort="createdAt:asc")
        sorted_desc = client.db.get_all(COLLECTION, limit=2, sort="createdAt:desc")
        print(f"sort=asc returned {len(sorted_asc)} docs, sort=desc returned {len(sorted_desc)} docs")
        if len(sorted_asc) >= 2 and len(sorted_desc) >= 2:
            if sorted_asc[0].get("_id") != sorted_desc[0].get("_id"):
                print("Sort order differs - sorting is working")
            else:
                print("Same first doc (may only have 1 document)")
    except Exception as e:
        print(f"sort query failed: {e}")

    # 19c. Filter
    try:
        filtered = client.db.get_all(COLLECTION, filter={"title": "SDK Test Post"}, limit=5)
        print(f"filter={{title: 'SDK Test Post'}} returned {len(filtered)} docs")
    except Exception as e:
        print(f"filter query failed: {e}")

    # ── 20. TOKEN: MANUAL OVERRIDE ──────────────────────────────
    separator("20. Token Override: Insert with Explicit Token")
    saved_token = client.auth.get_token()
    try:
        # Insert using an explicitly passed token (not relying on auto-storage)
        override_doc = client.db.insert(
            COLLECTION,
            {"title": "Token Override Test", "content": "Inserted with explicit token"},
            token=saved_token,  # explicitly passed
        )
        override_id = override_doc.get("_id")
        print(f"Insert with explicit token succeeded: _id={override_id}")

        # Verify we can read it back
        fetched = client.db.get_one(COLLECTION, override_id)
        print(f"   Verified: title={fetched.get('title')}")

        # Clean up
        client.db.delete(COLLECTION, override_id, token=saved_token)
        print(f"   Cleaned up: deleted {override_id}")
    except Exception as e:
        print(f"Token override test failed: {e}")

    # ── 21. ERROR CONSISTENCY ───────────────────────────────────
    separator("21. Error Consistency Check")

    # 21a. Invalid login -> should be AuthError (400 from backend)
    try:
        with UrBackendClient(api_key=API_KEY, base=BASE_URL) as c:
            c.auth.login("fake@fake.com", "wrong")
        print("Invalid login didn't raise!")
    except AuthError as e:
        print(f"Invalid login -> AuthError (status={e.status_code}): {e.message}")
    except ValidationError as e:
        print(f"Invalid login -> ValidationError (status={e.status_code}): {e.message}")
        print("   Note: Backend returns 400 for bad login, which maps to ValidationError.")
        print("   This is acceptable - callers should catch UrBackendError base class.")
    except Exception as e:
        print(f"Invalid login -> {type(e).__name__}: {e}")

    # 21b. Missing token -> should always be AuthError (local check)
    try:
        with UrBackendClient(api_key=API_KEY, base=BASE_URL) as c:
            c.auth.me()
        print("Missing token didn't raise!")
    except AuthError as e:
        print(f"Missing token -> AuthError (status={e.status_code}): {e.message}")
    except Exception as e:
        print(f"Missing token -> wrong type {type(e).__name__}: {e}")

    # ── 22. EDGE CASES: EMPTY INSERT & BAD QUERY ────────────────
    separator("22. Edge Cases: Empty Insert & Bad Query")

    # 22a. Empty insert data
    try:
        client.db.insert(COLLECTION, {}, token=client.auth.get_token())
        print("Empty insert succeeded (collection may have no required fields)")
    except ValidationError as e:
        print(f"Empty insert -> ValidationError: {e.message}")
    except Exception as e:
        print(f"Empty insert -> {type(e).__name__}: {e}")

    # 22b. get_all with no filters (should return all docs gracefully)
    try:
        all_no_filter = client.db.get_all(COLLECTION)
        print(f"get_all with no params returned {len(all_no_filter)} docs (type={type(all_no_filter).__name__})")
        assert isinstance(all_no_filter, list), "Expected list!"
    except Exception as e:
        print(f"get_all no-filter failed: {e}")

    # 22c. get_one with garbage ID
    try:
        client.db.get_one(COLLECTION, "not_a_valid_id")
        print("get_one with bad ID didn't raise!")
    except (NotFoundError, ValidationError) as e:
        print(f"get_one bad ID -> {type(e).__name__}: {e.message}")
    except Exception as e:
        print(f"get_one bad ID -> {type(e).__name__}: {e}")

    # ══════════════════════════════════════════════════════════════
    #  END OF ENHANCED TESTS
    # ══════════════════════════════════════════════════════════════

    # ── 23. LOGOUT ──────────────────────────────────────────────
    separator("23. Logout")
    result = client.auth.logout()
    print(f"Logged out: {result}")
    print(f"Token after logout: {client.auth.get_token()}")

    # ── DONE ────────────────────────────────────────────────────
    separator("ALL TESTS COMPLETE")
    print("Python SDK verification finished.\n")
    client.close()


if __name__ == "__main__":
    main()

