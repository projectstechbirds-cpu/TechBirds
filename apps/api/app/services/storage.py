"""Object storage abstraction.

Cloudflare R2 is S3-compatible, so boto3 + a custom endpoint is enough. In
development (no R2 credentials), files are written to `<repo>/var/r2/<bucket>/`
and "signed" URLs point at a `/dev-files/...` route on the API itself. This
keeps the dev loop free of cloud creds while exercising the same code paths.

Key convention (§4.10):
    documents/{user_id}/{type}/{yyyy-mm}-{nonce}.pdf
    payslips/{user_id}/{yyyy-mm}-{nonce}.pdf
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import boto3
from botocore.client import Config

from app.config import get_settings

SIGNED_URL_TTL_SECONDS = 300  # 5 minutes (§4.10)


@dataclass
class StoredObject:
    bucket: str
    key: str
    size_bytes: int


class _DevStorage:
    """Filesystem-backed fallback used when R2 credentials aren't configured."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, bucket: str, key: str) -> Path:
        p = self.root / bucket / key
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def put(self, bucket: str, key: str, body: bytes, content_type: str) -> StoredObject:
        path = self._path(bucket, key)
        path.write_bytes(body)
        return StoredObject(bucket=bucket, key=key, size_bytes=len(body))

    def get(self, bucket: str, key: str) -> bytes:
        return self._path(bucket, key).read_bytes()

    def delete(self, bucket: str, key: str) -> None:
        p = self._path(bucket, key)
        if p.exists():
            p.unlink()

    def signed_url(self, bucket: str, key: str, *, ttl: int = SIGNED_URL_TTL_SECONDS) -> str:
        # Token-free dev URL — protected at the route layer by current_user +
        # ownership/role checks. The token-style query param keeps it shaped
        # like the production signed URL so callers don't branch on env.
        nonce = secrets.token_urlsafe(8)
        return f"/dev-files/{bucket}/{key}?nonce={nonce}&ttl={ttl}"


class _R2Storage:
    def __init__(self, account_id: str, key_id: str, secret: str) -> None:
        endpoint = f"https://{account_id}.r2.cloudflarestorage.com"
        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=key_id,
            aws_secret_access_key=secret,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    def put(self, bucket: str, key: str, body: bytes, content_type: str) -> StoredObject:
        self.client.put_object(Bucket=bucket, Key=key, Body=body, ContentType=content_type)
        return StoredObject(bucket=bucket, key=key, size_bytes=len(body))

    def get(self, bucket: str, key: str) -> bytes:
        res = self.client.get_object(Bucket=bucket, Key=key)
        return res["Body"].read()

    def delete(self, bucket: str, key: str) -> None:
        self.client.delete_object(Bucket=bucket, Key=key)

    def signed_url(self, bucket: str, key: str, *, ttl: int = SIGNED_URL_TTL_SECONDS) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=ttl,
        )


@lru_cache
def get_storage() -> _DevStorage | _R2Storage:
    s = get_settings()
    if s.R2_ACCOUNT_ID and s.R2_ACCESS_KEY_ID and s.R2_SECRET_ACCESS_KEY:
        return _R2Storage(s.R2_ACCOUNT_ID, s.R2_ACCESS_KEY_ID, s.R2_SECRET_ACCESS_KEY)
    return _DevStorage(Path.cwd() / "var" / "r2")


def payslip_key(user_id: str, year: int, month: int) -> str:
    return f"payslips/{user_id}/{year:04d}-{month:02d}-{secrets.token_hex(4)}.pdf"


def document_key(user_id: str, doc_type: str, year: int, month: int) -> str:
    return f"documents/{user_id}/{doc_type}/{year:04d}-{month:02d}-{secrets.token_hex(4)}.pdf"
