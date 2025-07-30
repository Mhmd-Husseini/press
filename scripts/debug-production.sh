#!/bin/bash

echo "🔍 Debugging production environment..."

cd /var/www/phoenix-press

echo "📋 Environment Variables:"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."
echo "NODE_ENV: $NODE_ENV"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
echo "JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:0:10}..."

echo ""
echo "🗄️ Database Connection Test:"
# Test database connection
if command -v psql &> /dev/null; then
    echo "Testing PostgreSQL connection..."
    PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:[^@]*@[^:]*:\([^\/]*\)\/.*/\1/p') psql -h localhost -U postgres -d phoenix_press -c "SELECT 1;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
    fi
else
    echo "psql not available, testing via Node.js..."
    node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    prisma.\$connect()
      .then(() => {
        console.log('✅ Database connection successful');
        return prisma.\$disconnect();
      })
      .catch(err => {
        console.log('❌ Database connection failed:', err.message);
        process.exit(1);
      });
    "
fi

echo ""
echo "🚀 PM2 Status:"
pm2 status

echo ""
echo "📊 Application Health:"
curl -I http://localhost:3000 2>/dev/null || echo "❌ Application not responding"

echo ""
echo "📝 Recent PM2 Logs:"
pm2 logs phoenix-press --lines 20

echo ""
echo "🔧 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "📁 Application Files:"
ls -la /var/www/phoenix-press/
echo ""
echo "📄 .env file exists:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "First few lines:"
    head -5 .env
else
    echo "❌ .env file missing"
fi

echo ""
echo "🗄️ Prisma Client:"
if [ -f "node_modules/@prisma/client/index.js" ]; then
    echo "✅ Prisma client exists"
else
    echo "❌ Prisma client missing"
fi

echo ""
echo "🏗️ Build Output:"
if [ -d ".next" ]; then
    echo "✅ Next.js build exists"
    ls -la .next/
else
    echo "❌ Next.js build missing"
fi 