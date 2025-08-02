#!/bin/bash

echo "🚨 Emergency fix - Cleaning and redeploying..."

# Stop and delete PM2 process
pm2 stop phoenix-press || true
pm2 delete phoenix-press || true

# Completely remove the directory
sudo rm -rf /var/www/phoenix-press

# Create fresh directory
sudo mkdir -p /var/www/phoenix-press
sudo chown ubuntu:ubuntu /var/www/phoenix-press

cd /var/www/phoenix-press

echo "📥 Cloning fresh repository..."
git clone https://github.com/Mhmd-Husseini/press.git .

echo "🔄 Switching to staging branch..."
git checkout staging
git pull origin staging

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🔧 Setting up environment..."
# Create .env.production from environment variables
cat > .env.production << 'EOF'
# Database Configuration
DATABASE_URL="${DATABASE_URL}"

# Authentication
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
NEXTAUTH_URL="http://13.62.53.230"
NEXTAUTH_SECRET="your-super-secure-nextauth-secret-key-2024-phoenix-press"

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
NEXT_PUBLIC_APP_URL="http://13.62.53.230"
EOF

cp .env.production .env

echo "🗄️ Setting up database..."
pnpm prisma generate
pnpm prisma migrate deploy

echo "🏗️ Building application..."
pnpm build

echo "🚀 Starting application..."
pm2 start ecosystem.config.js

echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Emergency fix completed!"
echo "🌐 Application should be accessible at: http://13.62.53.230"

# Show status
pm2 status
echo "📊 Checking application health..."
curl -I http://localhost:3000 || echo "Application not responding" 