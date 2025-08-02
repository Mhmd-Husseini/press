#!/bin/bash

echo "🚀 Deploying pre-built application to t2.micro..."

# Stop PM2 process
pm2 stop phoenix-press || true
pm2 delete phoenix-press || true

# Create directory if it doesn't exist
sudo mkdir -p /var/www/phoenix-press
sudo chown ubuntu:ubuntu /var/www/phoenix-press

cd /var/www/phoenix-press

# Clean and clone fresh
echo "📥 Cloning fresh repository..."
sudo rm -rf /var/www/phoenix-press/*
sudo rm -rf /var/www/phoenix-press/.* 2>/dev/null || true
git clone https://github.com/Mhmd-Husseini/press.git .

# Switch to staging branch
git checkout staging
git pull origin staging

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile --production

echo "🔧 Setting up environment..."
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
# Use minimal memory for Prisma operations
export NODE_OPTIONS="--max-old-space-size=256"
echo "🔧 Generating Prisma client..."
pnpm prisma generate || {
    echo "⚠️ Prisma generate failed, trying with even less memory..."
    export NODE_OPTIONS="--max-old-space-size=128"
    pnpm prisma generate
}
echo "🗄️ Running database migrations..."
pnpm prisma migrate deploy || {
    echo "⚠️ Migration failed, but continuing..."
}

# Check if pre-built files exist
if [ -d ".next/standalone" ] && [ -f ".next/standalone/server.js" ]; then
    echo "✅ Pre-built application found!"
    
    # Copy static files for standalone mode
    echo "📁 Copying static files for standalone mode..."
    if [ -d ".next/static" ]; then
        cp -r .next/static .next/standalone/.next/
        echo "✅ Static files copied successfully"
    else
        echo "⚠️ Warning: .next/static directory not found"
    fi
    
    if [ -d "public" ]; then
        cp -r public .next/standalone/
        echo "✅ Public files copied successfully"
    else
        echo "⚠️ Warning: public directory not found"
    fi
    
    echo "🚀 Starting application..."
    pm2 start ecosystem.config.js
    echo "🔄 Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Deployment completed!"
else
    echo "❌ Pre-built application not found!"
    echo "📝 To deploy:"
    echo "1. Build locally: pnpm build"
    echo "2. Commit and push .next directory"
    echo "3. Run this script again"
    exit 1
fi