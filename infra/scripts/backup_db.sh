#!/usr/bin/env bash
# Daily Postgres backup → Cloudflare R2.
# - Streams pg_dump | gzip into a single file in /var/backups/techbirds.
# - Uploads to s3://$R2_BUCKET_BACKUPS/postgres/YYYY/MM/DD/techbirds-<ts>.sql.gz via aws-cli (s3v4).
# - Prunes local files older than 7 days; R2 retention is enforced by a bucket lifecycle rule.
#
# Reads creds + bucket name from /srv/techbirds/api/.env. Designed to run as the techbirds user.

set -euo pipefail

ENV_FILE="${ENV_FILE:-/srv/techbirds/api/.env}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/techbirds}"
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

if [[ -z "${DATABASE_URL_SYNC:-}" ]]; then
  echo "DATABASE_URL_SYNC missing from $ENV_FILE" >&2
  exit 1
fi
if [[ -z "${R2_ACCOUNT_ID:-}" || -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" || -z "${R2_BUCKET_BACKUPS:-}" ]]; then
  echo "R2 credentials or bucket missing from $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
TODAY_PREFIX="$(date -u +%Y/%m/%d)"
LOCAL_FILE="$BACKUP_DIR/techbirds-$TS.sql.gz"
REMOTE_KEY="postgres/$TODAY_PREFIX/techbirds-$TS.sql.gz"

# Strip the SQLAlchemy driver prefix so libpq accepts the URL.
PG_URL="${DATABASE_URL_SYNC#postgresql+psycopg://}"
PG_URL="postgresql://$PG_URL"

echo "[backup_db] dumping → $LOCAL_FILE"
pg_dump --no-owner --no-acl --format=plain "$PG_URL" | gzip -9 > "$LOCAL_FILE"

SIZE=$(stat -c '%s' "$LOCAL_FILE")
if (( SIZE < 1024 )); then
  echo "[backup_db] dump suspiciously small ($SIZE bytes), aborting upload" >&2
  exit 1
fi

echo "[backup_db] uploading → s3://$R2_BUCKET_BACKUPS/$REMOTE_KEY ($SIZE bytes)"
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 cp "$LOCAL_FILE" "s3://$R2_BUCKET_BACKUPS/$REMOTE_KEY" \
  --endpoint-url "https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
  --only-show-errors

echo "[backup_db] pruning local files older than $LOCAL_RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'techbirds-*.sql.gz' -mtime "+$LOCAL_RETENTION_DAYS" -delete

echo "[backup_db] done"
