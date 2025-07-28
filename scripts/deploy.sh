#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Variables
APP_DIR="/var/www/phoenix-press/press"
BACKUP_DIR="/var/backups/phoenix-press"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
sudo mkdir -p $BACKUP_DIR

# Stop the application
echo "⏹️ Stopping application..."
pm2 stop phoenix-press || true

# Backup current version
if [ -d "$APP_DIR" ]; then
    echo "📦 Creating backup..."
    sudo cp -r $APP_DIR $BACKUP_DIR/phoenix-press_$TIMESTAMP
fi

# Navigate to app directory
cd $APP_DIR

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Copy environment file
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ Environment file copied"
else
    echo "⚠️ Warning: .env.production not found, using existing .env"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
pnpm prisma migrate deploy

# Seed database (only on first deployment)
if [ ! -f "$APP_DIR/.deployed" ]; then
    echo "🌱 Seeding database..."
    pnpm prisma db seed || echo "⚠️ Seeding failed or already completed"
    touch $APP_DIR/.deployed
fi

# Build the application
echo "🏗️ Building application..."
pnpm build

# Setup log directory
sudo mkdir -p /var/log/phoenix-press
sudo chown -R $USER:$USER /var/log/phoenix-press

# Start the application with PM2
echo "▶️ Starting application..."
pm2 start ecosystem.config.js || pm2 restart phoenix-press
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl reload nginx

# Cleanup old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
sudo find $BACKUP_DIR -type d -name "phoenix-press_*" | sort -r | tail -n +6 | xargs -r sudo rm -rf

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: http://$(curl -s http://checkip.amazonaws.com)"

# Show application status
echo "📊 Application Status:"
pm2 status phoenix-press 