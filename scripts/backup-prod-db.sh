#!/bin/bash

# Production Database Backup Script
# Creates a compressed backup of production PostgreSQL database and downloads it locally

set -e  # Exit on error

# Configuration
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILENAME="prod-db-backup-${TIMESTAMP}.sql"
COMPRESSED_FILENAME="${BACKUP_FILENAME}.gz"
SSH_HOST="instepanavan"
REMOTE_PATH="./website"
LOCAL_BACKUP_DIR="./backups"

echo "🔄 Starting production database backup..."

# Create local backup directory if it doesn't exist
mkdir -p "${LOCAL_BACKUP_DIR}"

# Step 1: Create backup on production server
echo "📦 Creating backup on production server..."
ssh ${SSH_HOST} "cd ${REMOTE_PATH} && \
    docker compose -f docker-compose.prod.yml exec -T postgres pg_dumpall -U instep | \
    gzip > /tmp/${COMPRESSED_FILENAME}"

# Step 2: Download backup to local machine
echo "⬇️  Downloading backup to local machine..."
scp ${SSH_HOST}:/tmp/${COMPRESSED_FILENAME} ${LOCAL_BACKUP_DIR}/

# Step 3: Clean up remote backup file
echo "🧹 Cleaning up remote temporary file..."
ssh ${SSH_HOST} "rm /tmp/${COMPRESSED_FILENAME}"

# Step 4: Show success message
echo "✅ Backup completed successfully!"
echo "📁 Backup saved to: ${LOCAL_BACKUP_DIR}/${COMPRESSED_FILENAME}"
echo "📊 Backup size: $(du -h ${LOCAL_BACKUP_DIR}/${COMPRESSED_FILENAME} | cut -f1)"

# Optional: List all backups with human-readable dates
echo ""
echo "📚 All backups:"
for file in ${LOCAL_BACKUP_DIR}/*.sql.gz; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        date=$(stat -c %y "$file" 2>/dev/null || stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file")
        echo "  $(basename "$file") - $size - $date"
    fi
done
