#!/bin/bash

# Stop PM2 process first
pm2 stop phoenix-press || true
pm2 delete phoenix-press || true

# Create directory if it doesn't exist
sudo mkdir -p /var/www/phoenix-press
sudo chown ubuntu:ubuntu /var/www/phoenix-press
cd /var/www/phoenix-press

# Completely remove the directory contents and clone fresh
echo "🧹 Cleaning directory and cloning fresh repository..."
sudo rm -rf /var/www/phoenix-press/*
sudo rm -rf /var/www/phoenix-press/.* 2>/dev/null || true
git clone https://github.com/Mhmd-Husseini/press.git .

# Fetch latest changes and reset to staging branch
git fetch origin
git checkout staging
git reset --hard origin/staging

# Install dependencies
pnpm install --frozen-lockfile

# Create .env.production from secrets
cat > .env.production << 'EOF'
# Database Configuration
DATABASE_URL="${DATABASE_URL}"

# Authentication
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
NEXTAUTH_URL="${NEXTAUTH_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
AWS_DEFAULT_REGION="eu-north-1"
AWS_BUCKET="inventory-managment-husseini"
AWS_URL="https://inventory-managment-husseini.s3.eu-north-1.amazonaws.com"

# Public S3 URL
NEXT_PUBLIC_S3_URL="https://inventory-managment-husseini.s3.eu-north-1.amazonaws.com"

# Application Configuration
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1

# Application URL
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}"
EOF

cp .env.production .env

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Build the application
pnpm build

# Copy static files for standalone mode
echo "📁 Copying static files for standalone mode..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Start PM2
pm2 start ecosystem.config.js

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!" 