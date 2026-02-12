#!/bin/bash

# Production Files Backup Script
# Creates a compressed backup of uploaded files and other persistent data

set -e  # Exit on error

# Configuration
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILENAME="prod-files-${TIMESTAMP}.tar.gz"
SSH_HOST="instepanavan"
REMOTE_PATH="./website"
LOCAL_BACKUP_DIR="./backups"

echo "🔄 Starting production files backup..."

# Create local backup directory if it doesn't exist
mkdir -p "${LOCAL_BACKUP_DIR}"

# Step 1: Create backup on production server
echo "📦 Creating backup on production server..."
echo "   Backing up: server-data/, hatchet-data/, wireguard-config/"
ssh ${SSH_HOST} "cd ${REMOTE_PATH} && \
    tar -czf /tmp/${BACKUP_FILENAME} \
    server-data/ \
    hatchet-data/ \
    wireguard-config/ \
    2>/dev/null || true"

# Step 2: Download backup to local machine
echo "⬇️  Downloading backup to local machine..."
scp ${SSH_HOST}:/tmp/${BACKUP_FILENAME} ${LOCAL_BACKUP_DIR}/

# Step 3: Clean up remote backup file
echo "🧹 Cleaning up remote temporary file..."
ssh ${SSH_HOST} "rm /tmp/${BACKUP_FILENAME}"

# Step 4: Show success message
echo "✅ Files backup completed successfully!"
echo "📁 Backup saved to: ${LOCAL_BACKUP_DIR}/${BACKUP_FILENAME}"
echo "📊 Backup size: $(du -h ${LOCAL_BACKUP_DIR}/${BACKUP_FILENAME} | cut -f1)"

# Optional: List all backups
echo ""
echo "📚 All file backups:"
for file in ${LOCAL_BACKUP_DIR}/prod-files-*.tar.gz; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        date=$(stat -c %y "$file" 2>/dev/null || stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file")
        echo "  $(basename "$file") - $size - $date"
    fi
done
