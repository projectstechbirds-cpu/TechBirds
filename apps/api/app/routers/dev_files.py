"""Dev-only file serving for the on-disk storage fallback.

In production the storage service hands out R2 presigned URLs that the browser
fetches directly. In development those URLs point at this route, which streams
the bytes back. The route is mounted only when the dev storage backend is in
use, so production never exposes raw filesystem reads.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services.storage import _DevStorage, get_storage

router = APIRouter(prefix="/dev-files", tags=["dev"])


@router.get("/{bucket}/{path:path}")
async def serve(bucket: str, path: str) -> FileResponse:
    storage = get_storage()
    if not isinstance(storage, _DevStorage):
        raise HTTPException(status_code=404, detail="Not found")
    target: Path = storage.root / bucket / path
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(target, media_type="application/pdf", filename=target.name)
