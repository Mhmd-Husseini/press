#!/bin/bash

echo "🔍 Debugging deployment issues..."

echo "📊 System Information:"
echo "Memory:"
free -h
echo "Disk Space:"
df -h
echo "Node Version:"
node --version
echo "PNPM Version:"
pnpm --version

echo "📁 Directory Structure:"
ls -la /var/www/phoenix-press/
if [ -d "/var/www/phoenix-press/press" ]; then
    echo "Press directory exists"
    ls -la /var/www/phoenix-press/press/
else
    echo "Press directory does not exist"
fi

echo "🔧 PM2 Status:"
pm2 status

echo "📋 PM2 Logs:"
pm2 logs phoenix-press --lines 20

echo "🌐 Nginx Status:"
sudo systemctl status nginx

echo "🔌 Port Status:"
netstat -tlnp | grep :3000 || echo "Port 3000 not listening"

echo "📄 Environment Check:"
if [ -f "/var/www/phoenix-press/press/.env" ]; then
    echo "✅ .env file exists"
    echo "Environment variables:"
    grep -E "^(NEXTAUTH_URL|NEXT_PUBLIC_APP_URL|DATABASE_URL)" /var/www/phoenix-press/press/.env || echo "Key env vars not found"
else
    echo "❌ .env file not found"
fi

echo "🏗️ Build Directory Check:"
if [ -d "/var/www/phoenix-press/press/.next" ]; then
    echo "✅ .next directory exists"
    ls -la /var/www/phoenix-press/press/.next/
else
    echo "❌ .next directory not found"
fi

echo "📁 Standalone Check:"
if [ -d "/var/www/phoenix-press/press/.next/standalone" ]; then
    echo "✅ Standalone directory exists"
    ls -la /var/www/phoenix-press/press/.next/standalone/
else
    echo "❌ Standalone directory not found"
fi

echo "🔍 Application Health Check:"
curl -I http://localhost:3000 || echo "Application not responding on localhost:3000"
curl -I http://13.62.53.230 || echo "Application not responding on public IP" 