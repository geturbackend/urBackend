"""
urBackend Python SDK — Storage module.

Mirrors ``StorageModule`` from the TypeScript SDK.
Handles the three-step signed-URL upload flow and file deletion.
"""

from __future__ import annotations

import mimetypes
import os
from io import IOBase
from pathlib import Path
from typing import Any, BinaryIO, Dict, Optional, Union

import requests

from .exceptions import StorageError
from .http import UrBackendHTTP


class StorageModule:
    """Handles all ``/api/storage/*`` operations.

    The upload flow follows the same three-step signed-URL approach as the
    TypeScript SDK:

    1. Request a signed upload URL from urBackend.
    2. ``PUT`` the file directly to the cloud provider.
    3. Confirm the upload so urBackend can verify and update quota.

    Args:
        http: Shared :class:`~urbackend.http.UrBackendHTTP` instance.

    Example:
        >>> with open("report.pdf", "rb") as f:
        ...     result = client.storage.upload(f, filename="report.pdf")
        >>> print(result["url"])
    """

    def __init__(self, http: UrBackendHTTP) -> None:
        self._http = http

    def upload(
        self,
        file: Union[bytes, BinaryIO, "os.PathLike[str]", str],
        filename: Optional[str] = None,
        content_type: Optional[str] = None,
        timeout: float = 120,
    ) -> Dict[str, Any]:
        """Upload a file to urBackend storage.

        Accepts ``bytes``, a file-like object (opened in binary mode), or a
        filesystem path (``str`` or ``pathlib.Path``).

        Args:
            file: File data as bytes, a binary file-like object, or a path.
            filename: Override the filename sent to the server.  When omitted
                the original file name is inferred where possible.
            content_type: MIME type. Auto-detected from the filename when not
                provided (falls back to ``"application/octet-stream"``).

        Returns:
            Dict with at least ``url``, ``path``, and ``provider`` keys.

        Raises:
            ValueError: Unsupported file type passed.
            StorageError: Upload failed at the cloud-provider level.

        Example:
            >>> # Path
            >>> result = client.storage.upload("/tmp/image.png")
            >>> print(result["url"])

            >>> # Bytes
            >>> result = client.storage.upload(b"...", filename="data.bin")

            >>> # File object
            >>> with open("doc.pdf", "rb") as fh:
            ...     result = client.storage.upload(fh, filename="doc.pdf")
        """
        file_data: Any = None
        file_size: int = 0
        resolved_name: str
        should_close: bool = False

        # --- normalise input -------------------------------------------------
        if isinstance(file, (str, Path)):
            path_obj = Path(file)
            resolved_name = filename or path_obj.name
            file_size = path_obj.stat().st_size
            file_data = path_obj.open("rb")
            should_close = True
        elif isinstance(file, (bytes, bytearray)):
            resolved_name = filename or "file"
            file_size = len(file)
            file_data = bytes(file)
        elif isinstance(file, IOBase) or hasattr(file, "read"):
            raw_name = getattr(file, "name", None)
            resolved_name = filename or (
                os.path.basename(raw_name) if raw_name else "file"
            )
            file_data = file
            if hasattr(file_data, "seek") and hasattr(file_data, "tell"):
                current_pos = file_data.tell()
                file_data.seek(0, 2)
                file_size = file_data.tell()
                file_data.seek(current_pos)
            else:
                # Fallback: cannot seek, read into memory
                file_data = file_data.read()  # type: ignore[union-attr]
                file_size = len(file_data)
        else:
            raise ValueError(
                "Unsupported file type. Pass bytes, a binary file-like object, "
                "or a filesystem path (str / pathlib.Path)."
            )

        # --- resolve MIME type -----------------------------------------------
        if not content_type:
            guessed, _ = mimetypes.guess_type(resolved_name)
            content_type = guessed or "application/octet-stream"

        try:
            # Step 1 — obtain signed URL
            signed_info: Dict[str, Any] = self._http.request(
                "POST",
                "/api/storage/upload-request",
                body={
                    "filename": resolved_name,
                    "contentType": content_type,
                    "size": file_size,
                },
            )
            signed_url: str = signed_info["signedUrl"]
            file_path: str = signed_info["filePath"]
    
            # Step 2 — PUT directly to cloud provider
            put_resp = requests.put(
                signed_url,
                data=file_data,
                headers={"Content-Type": content_type},
                timeout=timeout,
            )
        finally:
            if should_close and hasattr(file_data, "close"):
                file_data.close()
        if not put_resp.ok:
            raise StorageError(
                f"Cloud provider upload failed: {put_resp.status_code} {put_resp.reason}",
                put_resp.status_code,
                "/api/storage/upload",
            )

        # Step 3 — confirm upload
        return self._http.request(
            "POST",
            "/api/storage/upload-confirm",
            body={"filePath": file_path, "size": file_size},
        )

    def delete_file(self, path: str) -> Dict[str, bool]:
        """Delete a stored file by its path or URL.

        Args:
            path: The file path or URL returned by :meth:`upload`.

        Returns:
            ``{"deleted": True}``

        Raises:
            StorageError: File not found or deletion failed.

        Example:
            >>> client.storage.delete_file("uploads/report.pdf")
        """
        return self._http.request(
            "DELETE", "/api/storage/file", body={"path": path}
        )
