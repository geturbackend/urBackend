"""
urBackend Python SDK — Database module.

Mirrors ``DatabaseModule`` from the TypeScript SDK.
Provides full CRUD + filtering / pagination / population helpers for any
MongoDB collection managed through urBackend.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

from .exceptions import NotFoundError
from .http import UrBackendHTTP


def _build_params(
    filter: Optional[Dict[str, Any]] = None,
    sort: Optional[str] = None,
    limit: Optional[int] = None,
    page: Optional[int] = None,
    skip: Optional[int] = None,
    populate: Optional[Union[str, List[str]]] = None,
    expand: Optional[Union[str, List[str]]] = None,
    count: bool = False,
    **extra: Any,
) -> Dict[str, Any]:
    """Convert keyword arguments into a flat query-parameter dict.
    
    Reserved params: sort, limit, page, skip, populate, expand, count.
    Filter keys and extra arguments must not conflict with reserved params.
    """
    params: Dict[str, Any] = {}
    reserved = {"sort", "limit", "page", "skip", "populate", "expand", "count"}

    if filter:
        for k, v in filter.items():
            if k in reserved:
                raise ValueError(f"Filter key '{k}' conflicts with a reserved query parameter.")
            params[k] = v

    if sort is not None:
        params["sort"] = sort
    if limit is not None:
        params["limit"] = limit
    if page is not None:
        params["page"] = page
    if skip is not None:
        params["skip"] = skip
    if populate is not None:
        params["populate"] = ",".join(populate) if isinstance(populate, list) else populate
    if expand is not None:
        params["expand"] = ",".join(expand) if isinstance(expand, list) else expand
    if count:
        params["count"] = "true"

    for k, v in extra.items():
        if k in reserved:
            raise ValueError(f"Extra argument '{k}' conflicts with a reserved query parameter.")
        params[k] = v

    return params


class CollectionRef:
    """Chainable collection reference returned by :meth:`DatabaseModule.collection`.

    Enables the ``client.db.collection("posts").find(...)`` style used in the
    task description.

    Args:
        db: Parent :class:`DatabaseModule` instance.
        name: Collection name.
    """

    def __init__(self, db: "DatabaseModule", name: str) -> None:
        self._db = db
        self._name = name

    def find(
        self,
        query: Optional[Dict[str, Any]] = None,
        *,
        sort: Optional[str] = None,
        limit: Optional[int] = None,
        page: Optional[int] = None,
        populate: Optional[Union[str, List[str]]] = None,
        token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Alias for :meth:`DatabaseModule.get_all` on this collection.

        Args:
            query: Field-level filter dict, e.g. ``{"status": "active"}``.
            sort: Sort expression, e.g. ``"createdAt:desc"``.
            limit: Maximum number of documents to return.
            page: Page number (1-based).
            populate: Reference field(s) to populate.
            token: Bearer token for RLS-protected reads.

        Returns:
            List of matching documents.

        Example:
            >>> posts = client.db.collection("posts").find(
            ...     {"status": "published"}, sort="createdAt:desc", limit=10
            ... )
        """
        return self._db.get_all(
            self._name,
            filter=query,
            sort=sort,
            limit=limit,
            page=page,
            populate=populate,
            token=token,
        )

    def insert(
        self,
        data: Dict[str, Any],
        token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Alias for :meth:`DatabaseModule.insert` on this collection.

        Args:
            data: Document data to insert.
            token: Bearer token (required when RLS is enabled).

        Returns:
            The inserted document including its generated ``_id``.

        Example:
            >>> post = client.db.collection("posts").insert(
            ...     {"title": "Hello", "body": "World"},
            ...     token=client.auth.get_token(),
            ... )
        """
        return self._db.insert(self._name, data, token=token)


class DatabaseModule:
    """Handles all ``/api/data/*`` CRUD operations.

    Row-Level Security (RLS) is supported transparently: pass the user's
    ``accessToken`` to write operations when RLS is enabled for a collection.

    Args:
        http: Shared :class:`~urbackend.http.UrBackendHTTP` instance.

    Example:
        >>> products = client.db.get_all("products",
        ...     filter={"price_gt": 50}, sort="price:asc")
    """

    def __init__(self, http: UrBackendHTTP) -> None:
        self._http = http

    def collection(self, name: str) -> CollectionRef:
        """Return a :class:`CollectionRef` for chained calls.

        Args:
            name: Collection name.

        Returns:
            A :class:`CollectionRef` bound to this collection.

        Example:
            >>> ref = client.db.collection("products")
            >>> items = ref.find({"category": "books"})
        """
        return CollectionRef(self, name)

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_all(
        self,
        collection: str,
        *,
        filter: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
        limit: Optional[int] = None,
        page: Optional[int] = None,
        skip: Optional[int] = None,
        populate: Optional[Union[str, List[str]]] = None,
        expand: Optional[Union[str, List[str]]] = None,
        token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch all documents from a collection with optional query params.

        Returns an empty list when the collection is empty or no documents
        match the filter (404 is silently converted).

        Args:
            collection: Collection name.
            filter: Key/value pairs used as equality or operator filters
                (e.g. ``{"price_gt": 100, "status": "active"}``).
            sort: Sort expression, e.g. ``"createdAt:desc"`` or ``"-price"``.
            limit: Maximum documents per page.
            page: 1-based page number.
            skip: Number of documents to skip (alternative to ``page``).
            populate: Reference field(s) to populate with related documents.
            expand: Fields to expand with nested data.
            token: Bearer token for RLS-protected collections.

        Returns:
            List of document dicts.

        Raises:
            AuthError: Missing / invalid API key or token.
            ValidationError: Malformed query params.

        Example:
            >>> posts = client.db.get_all(
            ...     "posts",
            ...     filter={"published": True},
            ...     sort="createdAt:desc",
            ...     limit=20,
            ... )
        """
        params = _build_params(
            filter=filter,
            sort=sort,
            limit=limit,
            page=page,
            skip=skip,
            populate=populate,
            expand=expand,
        )
        path = f"/api/data/{collection}"
        try:
            result = self._http.request("GET", path, params=params or None, token=token)
            # Backend returns { items: [...], total, page, limit } after
            # the http layer unwraps the { success, data, message } envelope.
            if isinstance(result, dict) and "items" in result:
                return result["items"]
            if isinstance(result, list):
                return result
            return []
        except NotFoundError:
            return []

    def count(
        self,
        collection: str,
        *,
        filter: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None,
    ) -> int:
        """Count documents in a collection with optional filters.

        Args:
            collection: Collection name.
            filter: Same filter syntax as :meth:`get_all`.
            token: Bearer token for RLS-protected collections.

        Returns:
            Total number of matching documents.

        Example:
            >>> total = client.db.count("orders", filter={"status": "pending"})
            >>> pages = -(-total // 25)  # ceiling division
        """
        params = _build_params(filter=filter, count=True)
        path = f"/api/data/{collection}"
        try:
            result = self._http.request("GET", path, params=params, token=token)
        except NotFoundError:
            return 0
        if isinstance(result, dict):
            return int(result.get("count", 0))
        return 0        

    def get_one(
        self,
        collection: str,
        doc_id: str,
        *,
        populate: Optional[Union[str, List[str]]] = None,
        expand: Optional[Union[str, List[str]]] = None,
        token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Fetch a single document by its ``_id``.

        Args:
            collection: Collection name.
            doc_id: MongoDB ObjectId string.
            populate: Reference field(s) to populate.
            expand: Fields to expand.
            token: Bearer token for RLS-protected collections.

        Returns:
            The document dict.

        Raises:
            NotFoundError: No document with that ID.
            AuthError: Missing / invalid API key or token.

        Example:
            >>> product = client.db.get_one("products", "507f1f77bcf86cd799439011")
            >>> print(product["name"])
        """
        params = _build_params(populate=populate, expand=expand)
        path = f"/api/data/{collection}/{doc_id}"
        return self._http.request("GET", path, params=params or None, token=token)

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def insert(
        self,
        collection: str,
        data: Dict[str, Any],
        token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Insert a new document into a collection.

        When RLS is enabled pass the user's ``accessToken`` so the document
        is associated with that user for ownership checks.

        Args:
            collection: Collection name.
            data: Document fields to insert.
            token: Bearer token (required when RLS write-protection is on).

        Returns:
            The created document including its generated ``_id``.

        Raises:
            ValidationError: Schema validation failed.
            AuthError: Write rejected (RLS or invalid token).

        Example:
            >>> post = client.db.insert(
            ...     "posts",
            ...     {"title": "My first post", "body": "Hello world!"},
            ...     token=client.auth.get_token(),
            ... )
            >>> print(post["_id"])
        """
        return self._http.request(
            "POST", f"/api/data/{collection}", body=data, token=token
        )

    def update(
        self,
        collection: str,
        doc_id: str,
        data: Dict[str, Any],
        token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Fully replace an existing document (PUT).

        Args:
            collection: Collection name.
            doc_id: MongoDB ObjectId string of the document to replace.
            data: Complete replacement document (existing fields not in
                ``data`` will be removed).
            token: Bearer token for RLS ownership check.

        Returns:
            The updated document.

        Raises:
            NotFoundError: Document not found.
            AuthError: Unauthorised write.

        Example:
            >>> updated = client.db.update(
            ...     "products", product_id,
            ...     {"name": "New Name", "price": 49.99},
            ... )
        """
        return self._http.request(
            "PUT", f"/api/data/{collection}/{doc_id}", body=data, token=token
        )

    def patch(
        self,
        collection: str,
        doc_id: str,
        data: Dict[str, Any],
        token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Partially update an existing document (PATCH).

        Only the fields present in ``data`` are changed; all other fields are
        left intact.

        Args:
            collection: Collection name.
            doc_id: MongoDB ObjectId string of the document to patch.
            data: Partial update dict.
            token: Bearer token for RLS ownership check.

        Returns:
            The updated document.

        Raises:
            NotFoundError: Document not found.
            AuthError: Unauthorised write.

        Example:
            >>> client.db.patch("products", product_id, {"price": 39.99})
        """
        return self._http.request(
            "PATCH", f"/api/data/{collection}/{doc_id}", body=data, token=token
        )

    def delete(
        self,
        collection: str,
        doc_id: str,
        token: Optional[str] = None,
    ) -> Dict[str, bool]:
        """Delete a document by its ``_id``.

        Args:
            collection: Collection name.
            doc_id: MongoDB ObjectId string of the document to delete.
            token: Bearer token for RLS ownership check.

        Returns:
            ``{"deleted": True}``

        Raises:
            AuthError: Unauthorised delete.

        Example:
            >>> result = client.db.delete("posts", post_id,
            ...                           token=client.auth.get_token())
            >>> assert result["deleted"] is True
        """
        # http.request raises on non-2xx, so reaching this point means the
        # delete succeeded.
        self._http.request(
            "DELETE", f"/api/data/{collection}/{doc_id}", token=token
        )
        return {"deleted": True}
