#!/bin/bash

echo "🔧 Fixing deployment..."

# Create directory if it doesn't exist
sudo mkdir -p /var/www/phoenix-press
sudo chown ubuntu:ubuntu /var/www/phoenix-press

cd /var/www/phoenix-press

# Check if git repository exists, if not clone it
if [ ! -d ".git" ]; then
    echo "Git repository not found, cloning..."
    git clone https://github.com/Mhmd-Husseini/press.git .
else
    echo "Git repository found, updating..."
fi

# Fetch latest changes and reset to staging branch
git fetch origin
git checkout staging
git reset --hard origin/staging

cd press

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
pm2 restart phoenix-press || pm2 start ecosystem.config.js

echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment fixed!"
echo "🌐 Application should be accessible at: http://13.62.53.230" 