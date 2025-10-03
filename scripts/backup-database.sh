#!/bin/bash

# Database Backup Script for EC2
# This script runs on your EC2 server using the existing IAM role

set -e  # Exit on any error

echo "🗄️ Creating database backup..."

# Set date variables
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="phoenix_backup_${DATE}.sql.gz"
BACKUP_PATH="/tmp/${BACKUP_FILE}"

# Check if AWS CLI is installed, install if missing
if ! command -v aws &> /dev/null; then
    echo "📦 Installing AWS CLI..."
    
    # Install unzip if not available
    if ! command -v unzip &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y unzip
    fi
    
    # Download and install AWS CLI v2
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    echo "✅ AWS CLI installed successfully"
fi

# Load environment variables
if [ -f ".env.production" ]; then
    source .env.production
elif [ -f ".env" ]; then
    source .env
else
    echo "❌ No environment file found!"
    exit 1
fi

# Extract database connection from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL_REGEX="^postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+)"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ Invalid DATABASE_URL format"
    exit 1
fi

echo "📊 Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"

# Create database dump
echo "🗂️ Creating database dump..."
PGPASSWORD="$DB_PASS" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    | gzip > "$BACKUP_PATH"

if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ Database dump failed!"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "✅ Database backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to S3 using EC2's IAM role
echo "📤 Uploading to S3..."
aws s3 cp "$BACKUP_PATH" "s3://$AWS_BUCKET/database-backups/${BACKUP_FILE}" \
    --region "$AWS_DEFAULT_REGION"

if [ $? -eq 0 ]; then
    echo "✅ Backup uploaded successfully!"
else
    echo "❌ S3 upload failed!"
    exit 1
fi

# Clean up old backups (keep last 12)
echo "🧹 Cleaning up old backups..."
aws s3api list-objects-v2 \
    --bucket "$AWS_BUCKET" \
    --prefix "database-backups/phoenix_backup_" \
    --region "$AWS_DEFAULT_REGION" \
    --query 'Contents[?LastModified < `'"$(date -u -d '12 weeks ago' '+%Y-%m-%dT%H:%M:%S+00:00')"'`].Key' \
    --output text \
| while read key; do
    if [ ! -z "$key" ]; then
        echo "🗑️ Deleting: $key"
        aws s3 rm "s3://$AWS_BUCKET/$key" --region "$AWS_DEFAULT_REGION"
    fi
done

# Clean up local backup
rm -f "$BACKUP_PATH"

echo "🎉 Backup completed successfully!"
echo "📅 Next automated backup: 2 weeks from now"
echo "🔗 S3 location: s3://$AWS_BUCKET/database-backups/"