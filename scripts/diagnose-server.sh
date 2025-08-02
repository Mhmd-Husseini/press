#!/bin/bash

echo "🔍 Diagnosing server issues..."

# Check PM2 status
echo "📊 PM2 Status:"
pm2 status

# Check if app is running on port 3000
echo "🌐 Checking port 3000:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ App is running on port 3000"
else
    echo "❌ App is NOT running on port 3000"
fi

# Check Nginx status
echo "🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l

# Check Nginx configuration
echo "🧪 Nginx Configuration Test:"
sudo nginx -t

# Check what's listening on port 80
echo "🔍 Port 80 listeners:"
sudo netstat -tlnp | grep :80

# Check Nginx sites
echo "📁 Nginx sites enabled:"
ls -la /etc/nginx/sites-enabled/

# Check Nginx error logs
echo "📋 Recent Nginx errors:"
sudo tail -n 10 /var/log/nginx/error.log

# Check Nginx access logs
echo "📋 Recent Nginx access:"
sudo tail -n 5 /var/log/nginx/access.log

# Test local connection
echo "🧪 Testing localhost:3000:"
curl -I http://localhost:3000 2>/dev/null || echo "❌ Cannot connect to localhost:3000"

# Check if the app directory exists
echo "📁 Checking app directory:"
ls -la /var/www/phoenix-press/

# Check if .env exists
echo "📄 Checking .env file:"
if [ -f /var/www/phoenix-press/.env ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing"
fi

echo "✅ Diagnosis completed!" 