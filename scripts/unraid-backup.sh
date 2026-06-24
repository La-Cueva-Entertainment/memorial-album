#!/bin/bash
# ── Lovecali — Daily Incremental Backup ───────────────────────────────────────
# Install via: Unraid > User Scripts plugin > Add New Script
# Schedule: daily at 3:00 AM
#
# How it works:
#   - Downloads the SQLite DB from the app's backup endpoint
#   - Uses rsync --link-dest for hard-link incrementals (unchanged files = 0 extra bytes)
#   - Keeps RETAIN_DAYS of history, then prunes older snapshots
#
# Setup:
#   1. Set SITE_URL to your public or LAN URL
#   2. Set BACKUP_SECRET to match BACKUP_SECRET in your container env vars
#   3. Set BACKUP_ROOT to wherever you want backups stored on Unraid
# ──────────────────────────────────────────────────────────────────────────────

SITE_URL="https://cali.yourdomain.com"        # no trailing slash
BACKUP_SECRET="change-me-to-your-backup-secret"
BACKUP_ROOT="/mnt/user/backups/lovecali"
RETAIN_DAYS=30

# ── Don't edit below this line ────────────────────────────────────────────────

TODAY=$(date +%Y-%m-%d)
SNAPSHOT_DIR="${BACKUP_ROOT}/snapshots/${TODAY}"
LATEST_LINK="${BACKUP_ROOT}/latest"
TEMP_FILE="/tmp/lovecali-backup-$$.db"

mkdir -p "${SNAPSHOT_DIR}"

echo "[lovecali-backup] Downloading database snapshot..."
HTTP_STATUS=$(curl -s -o "${TEMP_FILE}" -w "%{http_code}" \
  "${SITE_URL}/api/admin/backup?token=${BACKUP_SECRET}")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "[lovecali-backup] ERROR: Download failed (HTTP ${HTTP_STATUS})"
  rm -f "${TEMP_FILE}"
  exit 1
fi

echo "[lovecali-backup] Downloaded $(du -h "${TEMP_FILE}" | cut -f1)"

# rsync into today's snapshot, hard-linking unchanged files from the latest snapshot
if [ -d "${LATEST_LINK}" ]; then
  rsync -a --link-dest="${LATEST_LINK}" "${TEMP_FILE}" "${SNAPSHOT_DIR}/lovecali.db"
else
  cp "${TEMP_FILE}" "${SNAPSHOT_DIR}/lovecali.db"
fi

rm -f "${TEMP_FILE}"

# Update the latest symlink
ln -snf "${SNAPSHOT_DIR}" "${LATEST_LINK}"

echo "[lovecali-backup] Snapshot saved to ${SNAPSHOT_DIR}"

# Prune snapshots older than RETAIN_DAYS
echo "[lovecali-backup] Pruning snapshots older than ${RETAIN_DAYS} days..."
find "${BACKUP_ROOT}/snapshots" -maxdepth 1 -type d -mtime +${RETAIN_DAYS} -exec rm -rf {} + 2>/dev/null

echo "[lovecali-backup] Done. Snapshots retained:"
ls "${BACKUP_ROOT}/snapshots/" | sort
