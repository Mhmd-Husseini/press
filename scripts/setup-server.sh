#!/bin/bash
set -e

echo "🚀 Setting up Phoenix Press server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install curl for health checks
sudo apt install -y curl

# Create application directory
sudo mkdir -p /var/www/phoenix-press
sudo chown -R $USER:$USER /var/www/phoenix-press

# Setup PostgreSQL
sudo -u postgres createdb phoenix_press
sudo -u postgres createuser phoenix_user
sudo -u postgres psql -c "ALTER USER phoenix_user PASSWORD 'secure_password_123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE phoenix_press TO phoenix_user;"

# Create PostgreSQL configuration for external connections
sudo bash -c 'cat >> /etc/postgresql/14/main/postgresql.conf << EOF

# Phoenix Press Configuration
listen_addresses = '\''localhost'\''
EOF'

sudo bash -c 'cat >> /etc/postgresql/14/main/pg_hba.conf << EOF

# Phoenix Press Database Access
local   phoenix_press   phoenix_user                    md5
EOF'

sudo systemctl restart postgresql

# Setup Nginx configuration
sudo bash -c 'cat > /etc/nginx/sites-available/phoenix-press << EOF
server {
    listen 80;
    server_name _;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection '\''upgrade'\'';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF'

# Enable the site
sudo ln -sf /etc/nginx/sites-available/phoenix-press /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create deployment user
sudo useradd -m -s /bin/bash deploy || true
sudo usermod -aG sudo deploy

# Setup SSH key for deploy user
sudo mkdir -p /home/deploy/.ssh
sudo touch /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Allow deploy user to restart services without password
sudo bash -c 'cat >> /etc/sudoers << EOF

# Deploy user permissions
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
deploy ALL=(ALL) NOPASSWD: /usr/bin/pm2
%ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
%ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
EOF'

# Create log directory
sudo mkdir -p /var/log/phoenix-press
sudo chown -R $USER:$USER /var/log/phoenix-press

# Create backup directory
sudo mkdir -p /var/backups/phoenix-press
sudo chown -R $USER:$USER /var/backups/phoenix-press

echo "✅ Server setup completed!"
echo "📝 Database URL: postgresql://phoenix_user:secure_password_123@localhost:5432/phoenix_press"
echo "🌐 Your server is ready at: http://$(curl -s http://checkip.amazonaws.com)" 