# Phoenix Press - AWS EC2 Deployment Guide

This guide will help you deploy Phoenix Press to AWS EC2 with PostgreSQL database on the same instance, using GitHub Actions for automatic deployment when pushing to the staging branch.

## 📋 **Prerequisites**

- AWS Account with EC2 access
- GitHub repository
- Basic knowledge of AWS EC2 and Linux

## 🚀 **Step 1: Create AWS EC2 Instance**

### 1.1 Launch EC2 Instance

```bash
# Create key pair for SSH access
aws ec2 create-key-pair \
  --key-name phoenix-press-key \
  --query 'KeyMaterial' \
  --output text > phoenix-press-key.pem

chmod 400 phoenix-press-key.pem

# Create security group
aws ec2 create-security-group \
  --group-name phoenix-press-sg \
  --description "Security group for Phoenix Press application"

# Get security group ID
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
  --group-names phoenix-press-sg \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Add inbound rules
aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SECURITY_GROUP_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0

# Launch EC2 instance (Ubuntu 22.04 LTS)
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --count 1 \
  --instance-type t3.medium \
  --key-name phoenix-press-key \
  --security-group-ids $SECURITY_GROUP_ID \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=phoenix-press-server}]'
```

### 1.2 Get Instance Public IP

```bash
# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=phoenix-press-server" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Your EC2 Public IP: $PUBLIC_IP"
```

## 🔧 **Step 2: Server Setup Script**

Create `scripts/setup-server.sh`:

```bash
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
listen_addresses = '"'"'localhost'"'"'
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
        proxy_set_header Connection '"'"'upgrade'"'"';
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
sudo useradd -m -s /bin/bash deploy
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
deploy ALL=(ALL) NOPASSWD: /usr/bin/pm2
EOF'

echo "✅ Server setup completed!"
echo "📝 Database URL: postgresql://phoenix_user:secure_password_123@localhost:5432/phoenix_press"
echo "🌐 Your server is ready at: http://$PUBLIC_IP"
```

## 📁 **Step 3: Create Required Files**

### 3.1 Create `.env.production` file:

```bash
# Database Configuration
DATABASE_URL="postgresql://phoenix_user:secure_password_123@localhost:5432/phoenix_press"

# Authentication
JWT_ACCESS_SECRET="your-super-secure-jwt-secret-key-for-production-2024"

# AWS S3 Configuration (Create a small S3 bucket for media)
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_DEFAULT_REGION="us-east-1"
AWS_BUCKET="phoenix-press-media-staging"
AWS_URL="https://phoenix-press-media-staging.s3.us-east-1.amazonaws.com"

# Public S3 URL
NEXT_PUBLIC_S3_URL="https://phoenix-press-media-staging.s3.us-east-1.amazonaws.com"

# Application Configuration
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED=1

# Admin Credentials
ADMIN_EMAIL="admin@phoenix.com"
ADMIN_PASSWORD="secure-admin-password-123"

# Application URL
NEXT_PUBLIC_APP_URL="http://your-ec2-public-ip"
```

### 3.2 Create `ecosystem.config.js` for PM2:

```javascript
module.exports = {
  apps: [
    {
      name: 'phoenix-press',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/phoenix-press',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/phoenix-press/error.log',
      out_file: '/var/log/phoenix-press/access.log',
      log_file: '/var/log/phoenix-press/combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=512'
    }
  ]
};
```

### 3.3 Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Variables
APP_DIR="/var/www/phoenix-press"
BACKUP_DIR="/var/backups/phoenix-press"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory
sudo mkdir -p $BACKUP_DIR

# Stop the application
echo "⏹️ Stopping application..."
pm2 stop phoenix-press || true

# Backup current version
if [ -d "$APP_DIR" ]; then
    echo "📦 Creating backup..."
    sudo cp -r $APP_DIR $BACKUP_DIR/phoenix-press_$TIMESTAMP
fi

# Create app directory if it doesn't exist
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone or pull latest code
if [ -d "$APP_DIR/.git" ]; then
    echo "🔄 Pulling latest changes..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/staging
else
    echo "📥 Cloning repository..."
    git clone -b staging https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git $APP_DIR
    cd $APP_DIR
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Copy environment file
cp .env.production .env

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
pnpm prisma migrate deploy

# Seed database (only on first deployment)
if [ ! -f "$APP_DIR/.deployed" ]; then
    echo "🌱 Seeding database..."
    pnpm prisma db seed
    touch $APP_DIR/.deployed
fi

# Build the application
echo "🏗️ Building application..."
pnpm build

# Setup log directory
sudo mkdir -p /var/log/phoenix-press
sudo chown -R $USER:$USER /var/log/phoenix-press

# Start the application with PM2
echo "▶️ Starting application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u $USER --hp /home/$USER

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# Cleanup old backups (keep last 5)
echo "🧹 Cleaning up old backups..."
sudo find $BACKUP_DIR -type d -name "phoenix-press_*" | sort -r | tail -n +6 | xargs -r sudo rm -rf

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at: http://$(curl -s http://checkip.amazonaws.com)"
```

### 3.4 Create `scripts/health-check.sh`:

```bash
#!/bin/bash

# Health check script
APP_URL="http://localhost:3000"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "🔍 Starting health check..."

for i in $(seq 1 $MAX_RETRIES); do
    if curl -f -s $APP_URL > /dev/null; then
        echo "✅ Application is healthy!"
        exit 0
    else
        echo "⏳ Attempt $i/$MAX_RETRIES failed, retrying in $RETRY_INTERVAL seconds..."
        sleep $RETRY_INTERVAL
    fi
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
```

## 🔄 **Step 4: GitHub Actions Workflow**

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to EC2 Staging

on:
  push:
    branches: [ staging ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: latest

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Run tests
      run: pnpm lint

    - name: Deploy to EC2
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /var/www/phoenix-press
          git fetch origin
          git reset --hard origin/staging
          pnpm install --frozen-lockfile
          pnpm prisma generate
          pnpm prisma migrate deploy
          pnpm build
          pm2 restart phoenix-press
          sudo systemctl reload nginx

    - name: Health Check
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /var/www/phoenix-press
          chmod +x scripts/health-check.sh
          ./scripts/health-check.sh

    - name: Notify on Success
      if: success()
      run: |
        echo "🎉 Deployment successful!"
        echo "🌐 Application URL: http://${{ secrets.EC2_HOST }}"

    - name: Notify on Failure
      if: failure()
      run: |
        echo "❌ Deployment failed!"
        echo "Please check the logs and try again."
```

## 🔑 **Step 5: GitHub Secrets Setup**

Add these secrets to your GitHub repository (Settings → Secrets and Variables → Actions):

```
EC2_HOST=your-ec2-public-ip
EC2_USERNAME=ubuntu
EC2_SSH_KEY=your-private-key-content
```

## 🛠️ **Step 6: Deployment Steps**

### 6.1 Connect to your EC2 instance:

```bash
ssh -i phoenix-press-key.pem ubuntu@your-ec2-public-ip
```

### 6.2 Run the server setup script:

```bash
# Upload and run setup script
scp -i phoenix-press-key.pem scripts/setup-server.sh ubuntu@your-ec2-public-ip:/home/ubuntu/
ssh -i phoenix-press-key.pem ubuntu@your-ec2-public-ip
chmod +x setup-server.sh
./setup-server.sh
```

### 6.3 Create S3 bucket for media:

```bash
# Create S3 bucket
aws s3 mb s3://phoenix-press-media-staging

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket phoenix-press-media-staging --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::phoenix-press-media-staging/*"
    }
  ]
}'
```

### 6.4 Add your SSH key to deploy user:

```bash
# On your local machine
cat ~/.ssh/id_rsa.pub

# On EC2 instance
sudo -u deploy bash
echo "your-public-key-here" >> /home/deploy/.ssh/authorized_keys
```

### 6.5 Initial deployment:

```bash
# On EC2 instance
cd /var/www
sudo chown -R ubuntu:ubuntu phoenix-press
git clone -b staging https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git phoenix-press
cd phoenix-press
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📋 **Step 7: Required Changes to Your Code**

### 7.1 Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Add this for production
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phoenix-press-media-staging.s3.amazonaws.com', // Update this
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static-cse.canva.com',
        pathname: '/**',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: false, // Change to false for production
  },
  eslint: {
    ignoreDuringBuilds: false, // Change to false for production
  },
  reactStrictMode: true, // Change to true for production
};

export default nextConfig;
```

### 7.2 Update package.json scripts:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start -H 0.0.0.0 -p 3000",
    "lint": "next lint",
    "prisma:generate": "pnpm prisma generate",
    "prisma:migrate": "pnpm prisma migrate deploy",
    "prisma:seed": "pnpm prisma db seed"
  }
}
```

### 7.3 Create `scripts/start-production.sh`:

```bash
#!/bin/bash
export NODE_ENV=production
export PORT=3000
npm start
```

## 🚀 **Step 8: Testing the Deployment**

### 8.1 Push to staging branch:

```bash
git checkout -b staging
git add .
git commit -m "Initial staging deployment"
git push origin staging
```

### 8.2 Monitor the deployment:

- Go to your GitHub repository
- Click on "Actions" tab
- Watch the deployment progress

### 8.3 Verify the application:

```bash
# Check application status
curl http://your-ec2-public-ip

# Check specific endpoints
curl http://your-ec2-public-ip/api/posts
curl http://your-ec2-public-ip/api/breaking-news?locale=en
```

## 🔧 **Step 9: Monitoring and Logs**

### 9.1 View application logs:

```bash
# PM2 logs
pm2 logs phoenix-press

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### 9.2 Monitor system resources:

```bash
# Install htop
sudo apt install htop

# Monitor resources
htop

# Check disk usage
df -h

# Check memory usage
free -h
```

## 🔄 **Step 10: Backup Strategy**

### 10.1 Database backup script `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/phoenix-press/db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

sudo mkdir -p $BACKUP_DIR

# Create database backup
sudo -u postgres pg_dump phoenix_press > $BACKUP_DIR/phoenix_press_$TIMESTAMP.sql

# Compress backup
gzip $BACKUP_DIR/phoenix_press_$TIMESTAMP.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Database backup completed: phoenix_press_$TIMESTAMP.sql.gz"
```

### 10.2 Setup cron job for automatic backups:

```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /var/www/phoenix-press/scripts/backup-db.sh
```

## 📊 **Step 11: Performance Optimization**

### 11.1 Enable swap (for small instances):

```bash
# Create swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 11.2 Optimize PM2 configuration:

```javascript
module.exports = {
  apps: [
    {
      name: 'phoenix-press',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/phoenix-press',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/phoenix-press/error.log',
      out_file: '/var/log/phoenix-press/access.log',
      log_file: '/var/log/phoenix-press/combined.log',
      time: true,
      max_memory_restart: '400M',
      node_args: '--max-old-space-size=400',
      kill_timeout: 5000,
      restart_delay: 1000,
      max_restarts: 3,
      min_uptime: '10s'
    }
  ]
};
```

## 🎉 **Congratulations!**

Your Phoenix Press application is now deployed on AWS EC2 with:

- ✅ Automatic deployment via GitHub Actions
- ✅ PostgreSQL database on the same instance
- ✅ Nginx reverse proxy
- ✅ PM2 process management
- ✅ SSL ready (you can add Let's Encrypt later)
- ✅ Monitoring and logging
- ✅ Backup strategy

**Your application should be accessible at:** `http://your-ec2-public-ip`

## 🔧 **Troubleshooting**

### Common Issues:

1. **Application not starting:**
   ```bash
   pm2 logs phoenix-press
   pm2 restart phoenix-press
   ```

2. **Database connection issues:**
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -c "\l"
   ```

3. **Nginx not serving:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Memory issues:**
   ```bash
   free -h
   pm2 monit
   ```

### Getting Help:

- Check PM2 logs: `pm2 logs`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check system logs: `journalctl -xe`
- Monitor resources: `htop`

**Remember to:**
- Replace `YOUR_USERNAME/YOUR_REPO_NAME` with your actual GitHub repository
- Update the EC2 public IP in all configuration files
- Set up proper SSL certificates for production
- Configure proper database passwords
- Set up monitoring and alerting 