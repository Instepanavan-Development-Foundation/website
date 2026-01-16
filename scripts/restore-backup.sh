#!/bin/bash

# Restore Database from Backup Script
# Restores a compressed database backup to local PostgreSQL

set -e  # Exit on error

# Configuration
LOCAL_BACKUP_DIR="./backups"

echo "🔄 Starting database restore..."

# Step 1: List available backups
echo "📚 Available backups:"
ls -lht ${LOCAL_BACKUP_DIR}/*.sql.gz 2>/dev/null || {
    echo "❌ No backups found in ${LOCAL_BACKUP_DIR}/"
    exit 1
}

# Step 2: Get the latest backup (or user can specify)
if [ -z "$1" ]; then
    BACKUP_FILE=$(ls -t ${LOCAL_BACKUP_DIR}/*.sql.gz | head -1)
    echo ""
    echo "📦 Using latest backup: $(basename ${BACKUP_FILE})"
else
    BACKUP_FILE="$1"
    echo ""
    echo "📦 Using specified backup: $(basename ${BACKUP_FILE})"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Step 3: Confirm action
echo ""
echo "⚠️  WARNING: This will replace your local database!"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Step 4: Stop containers
echo "🛑 Stopping containers..."
docker compose -f docker-compose.dev.yml down

# Step 5: Backup current local data (if exists)
if [ -d "postgres" ]; then
    echo "💾 Backing up current local data..."
    mv postgres postgres-backup-$(date +%Y%m%d_%H%M%S)
fi

# Step 6: Clean postgres directory
echo "🧹 Cleaning postgres directory..."
rm -rf postgres/

# Step 7: Start PostgreSQL 17
echo "🚀 Starting PostgreSQL 17..."
docker compose -f docker-compose.dev.yml up -d postgres

# Step 8: Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if postgres is running
if ! docker compose -f docker-compose.dev.yml ps postgres | grep -q "Up"; then
    echo "❌ PostgreSQL failed to start"
    docker compose -f docker-compose.dev.yml logs postgres
    exit 1
fi

# Step 9: Restore backup
echo "📥 Restoring backup to PostgreSQL 17..."
gunzip -c "${BACKUP_FILE}" | docker compose -f docker-compose.dev.yml exec -T postgres psql -U strapi

# Step 10: Start all services
echo "🚀 Starting all services..."
docker compose -f docker-compose.dev.yml up -d

# Step 11: Verify
echo ""
echo "✅ Restore completed successfully!"
echo "🔍 Verifying services..."
docker compose -f docker-compose.dev.yml ps

echo ""
echo "✨ Done! Your local database now has production data."
echo "🌐 Access Strapi at: http://localhost:1337"
echo "📊 Access Hatchet at: http://localhost:8080"
