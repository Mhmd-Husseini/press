#!/bin/bash

echo "🔒 Setting up SSL certificate for husseini.click..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update

# Install Certbot and Nginx plugin
echo "🔧 Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

# Check if Nginx is running
echo "🌐 Checking Nginx status..."
if ! sudo systemctl is-active --quiet nginx; then
    echo "⚠️ Nginx is not running. Starting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Check if domain resolves
echo "🔍 Checking domain resolution..."
if ! nslookup husseini.click > /dev/null 2>&1; then
    echo "⚠️ Warning: husseini.click might not be resolving yet."
    echo "   Please wait 5-10 minutes for DNS propagation."
    echo "   You can continue, but certificate might fail."
fi

# Configure Nginx for the domain
echo "⚙️ Configuring Nginx for husseini.click..."
sudo tee /etc/nginx/sites-available/husseini.click > /dev/null << 'EOF'
server {
    listen 80;
    server_name husseini.click www.husseini.click;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/husseini.click /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
    sudo systemctl reload nginx
else
    echo "❌ Nginx configuration is invalid"
    exit 1
fi

# Get SSL certificate
echo "🎫 Obtaining SSL certificate..."
sudo certbot --nginx -d husseini.click -d www.husseini.click --non-interactive --agree-tos --email admin@husseini.click --redirect

# Check if certificate was obtained successfully
if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # Test auto-renewal
    echo "🔄 Testing certificate renewal..."
    sudo certbot renew --dry-run
    
    # Set up auto-renewal cron job
    echo "⏰ Setting up auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 */12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    # Reload Nginx
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    
    echo "✅ SSL setup completed successfully!"
    echo "🌐 Your site is now secure at: https://husseini.click"
    echo "🔒 Certificate will auto-renew every 90 days"
    
    # Show certificate info
    echo "📋 Certificate information:"
    sudo certbot certificates
    
else
    echo "❌ SSL certificate setup failed!"
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check if domain is pointing to this server"
    echo "   2. Ensure ports 80 and 443 are open"
    echo "   3. Wait for DNS propagation (5-10 minutes)"
    echo "   4. Check Nginx configuration"
    exit 1
fi 