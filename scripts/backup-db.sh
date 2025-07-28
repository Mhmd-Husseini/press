#!/bin/bash
BACKUP_DIR="/var/backups/phoenix-press/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
sudo mkdir -p $BACKUP_DIR

echo "🗄️ Starting database backup..."

# Create database backup
sudo -u postgres pg_dump phoenix_press > $BACKUP_DIR/phoenix_press_$TIMESTAMP.sql

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup created successfully"
    
    # Compress backup
    gzip $BACKUP_DIR/phoenix_press_$TIMESTAMP.sql
    echo "🗜️ Backup compressed: phoenix_press_$TIMESTAMP.sql.gz"
    
    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
    echo "🧹 Old backups cleaned up (keeping last 7 days)"
    
    # Show backup size
    BACKUP_SIZE=$(du -h $BACKUP_DIR/phoenix_press_$TIMESTAMP.sql.gz | cut -f1)
    echo "📊 Backup size: $BACKUP_SIZE"
    
    echo "✅ Database backup completed: phoenix_press_$TIMESTAMP.sql.gz"
else
    echo "❌ Database backup failed!"
    exit 1
fi 