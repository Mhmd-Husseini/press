# Phoenix Press - Quick EC2 Deployment Guide

## 🚀 **Quick Setup (30 minutes)**

### **Step 1: Create EC2 Instance**

```bash
# 1. Create key pair
aws ec2 create-key-pair --key-name phoenix-press-key --query 'KeyMaterial' --output text > phoenix-press-key.pem
chmod 400 phoenix-press-key.pem

# 2. Create security group
aws ec2 create-security-group --group-name phoenix-press-sg --description "Phoenix Press Security Group"

# 3. Get security group ID
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups --group-names phoenix-press-sg --query 'SecurityGroups[0].GroupId' --output text)

# 4. Add security rules
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SECURITY_GROUP_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0

# 5. Launch instance
aws ec2 run-instances \
  --image-id ami-0c7217cdde317cfec \
  --count 1 \
  --instance-type t3.medium \
  --key-name phoenix-press-key \
  --security-group-ids $SECURITY_GROUP_ID \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=phoenix-press-server}]'

# 6. Get public IP
PUBLIC_IP=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=phoenix-press-server" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "Your EC2 Public IP: $PUBLIC_IP"
```

### **Step 2: Setup Server**

```bash
# 1. Connect to EC2
ssh -i phoenix-press-key.pem ubuntu@$PUBLIC_IP

# 2. Upload setup script
exit
scp -i phoenix-press-key.pem scripts/setup-server.sh ubuntu@$PUBLIC_IP:/home/ubuntu/

# 3. Run setup script
ssh -i phoenix-press-key.pem ubuntu@$PUBLIC_IP
chmod +x setup-server.sh
./setup-server.sh
```

### **Step 3: Create S3 Bucket**

```bash
# Create S3 bucket for media files
aws s3 mb s3://phoenix-press-media-staging

# Set public read policy
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

### **Step 4: Setup GitHub Secrets**

Go to your GitHub repository → Settings → Secrets and Variables → Actions

Add these secrets:
```
EC2_HOST=YOUR_EC2_PUBLIC_IP
EC2_USERNAME=ubuntu
EC2_SSH_KEY=CONTENT_OF_phoenix-press-key.pem
```

### **Step 5: Update Environment Variables**

Create `.env.production` in your repository:

```bash
# Database Configuration
DATABASE_URL="postgresql://phoenix_user:secure_password_123@localhost:5432/phoenix_press"

# Authentication
JWT_ACCESS_SECRET="your-super-secure-jwt-secret-key-for-production-2024"

# AWS S3 Configuration
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
NEXT_PUBLIC_APP_URL="http://YOUR_EC2_PUBLIC_IP"
```

### **Step 6: Initial Deployment**

```bash
# 1. Create staging branch
git checkout -b staging
git add .
git commit -m "Initial staging deployment"
git push origin staging

# 2. Monitor deployment
# Go to GitHub → Actions tab and watch the deployment

# 3. Access your application
# http://YOUR_EC2_PUBLIC_IP
```

## 🔧 **Update Repository URLs**

Update these files with your GitHub repository URL:

1. `scripts/deploy.sh` - Line 35: Replace `YOUR_USERNAME/YOUR_REPO_NAME`
2. `AWS_EC2_DEPLOYMENT_GUIDE.md` - Multiple locations

## 📝 **Quick Commands**

```bash
# Check application status
ssh -i phoenix-press-key.pem ubuntu@$PUBLIC_IP "pm2 status"

# View logs
ssh -i phoenix-press-key.pem ubuntu@$PUBLIC_IP "pm2 logs phoenix-press"

# Restart application
ssh -i phoenix-press-key.pem ubuntu@$PUBLIC_IP "pm2 restart phoenix-press"

# Check health
curl http://$PUBLIC_IP

# Manual deployment
ssh -i phoenix-press-key.pem ubuntu@$PUBLIC_IP "cd /var/www/phoenix-press && ./scripts/deploy.sh"
```

## 🚨 **Important Notes**

1. **Replace placeholders:**
   - `YOUR_EC2_PUBLIC_IP` with actual IP
   - `YOUR_USERNAME/YOUR_REPO_NAME` with GitHub repository
   - AWS credentials in `.env.production`

2. **Security:**
   - Change default database password
   - Use strong JWT secret
   - Update admin credentials

3. **Monitoring:**
   - Application: `pm2 monit`
   - System: `htop`
   - Logs: `pm2 logs`

## 🎉 **Success!**

Your Phoenix Press application should now be live at `http://YOUR_EC2_PUBLIC_IP`

- Admin dashboard: `http://YOUR_EC2_PUBLIC_IP/admin`
- API health: `http://YOUR_EC2_PUBLIC_IP/api/posts`
- Breaking news: `http://YOUR_EC2_PUBLIC_IP/api/breaking-news?locale=en` 