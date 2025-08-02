#!/bin/bash

echo "🔧 Fixing server issues..."

# Stop PM2 processes
echo "🛑 Stopping PM2 processes..."
pm2 stop all
pm2 delete all

# Navigate to app directory
cd /var/www/phoenix-press

# Check if .env exists, if not create it
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://phoenix_user:secure_password_123@localhost:5432/phoenix_press"

# Authentication
JWT_ACCESS_SECRET="your-super-secure-jwt-secret-key-2024"
NEXTAUTH_URL="http://13.49.77.209"
NEXTAUTH_SECRET="your-super-secure-nextauth-secret-key-2024-phoenix-press"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_DEFAULT_REGION="eu-north-1"
AWS_BUCKET="inventory-managment-husseini"
AWS_URL="https://inventory-managment-husseini.s3.eu-north-1.amazonaws.com"
NEXT_PUBLIC_S3_URL="https://inventory-managment-husseini.s3.eu-north-1.amazonaws.com"

# Application Configuration
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL="http://13.49.77.209"
EOF
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# Run migrations
echo "🗄️ Running database migrations..."
pnpm prisma migrate deploy

# Build the application
echo "🏗️ Building application..."
pnpm build

# Copy static files for standalone mode
echo "📁 Copying static files..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Start the application
echo "🚀 Starting application..."
pm2 start ecosystem.config.js

# Wait a moment for the app to start
echo "⏳ Waiting for app to start..."
sleep 5

# Test if the app is running
echo "🧪 Testing application..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running on port 3000"
else
    echo "❌ Application failed to start"
    pm2 logs --lines 20
    exit 1
fi

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Server fix completed!"
echo "🌐 Your site should now be accessible at: http://13.49.77.209" 