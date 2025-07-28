#!/bin/bash

# Health check script
APP_URL="http://localhost:3000"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "🔍 Starting health check..."

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s $APP_URL > /dev/null; then
        echo "✅ Application is healthy!"
        echo "🌐 Application is accessible at: $APP_URL"
        echo "📊 Response status: $(curl -s -o /dev/null -w "%{http_code}" $APP_URL)"
        exit 0
    else
        echo "⏳ Attempt $i/$MAX_RETRIES failed, retrying in $RETRY_INTERVAL seconds..."
        sleep $RETRY_INTERVAL
    fi
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
echo "🔧 Troubleshooting steps:"
echo "  - Check if the application is running: pm2 status"
echo "  - Check application logs: pm2 logs phoenix-press"
echo "  - Check if port 3000 is available: netstat -tlnp | grep :3000"
echo "  - Check nginx status: sudo systemctl status nginx"
exit 1 