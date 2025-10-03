# Database Backup GitHub Action Setup

## 🔐 Required GitHub Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

### Database Connection
```
DB_HOST = 13.49.77.209
DB_PORT = 5432
DB_USER = phoenix_user
DB_NAME = phoenix_press
DB_PASSWORD = your_database_password
```

### AWS Credentials
```
AWS_ACCESS_KEY_ID = your_aws_access_key_id
AWS_SECRET_ACCESS_KEY = your_aws_secret_access_key
```

> Note: Use the same AWS credentials from your deployment environment

## 🚀 Activation Steps

1. **Add secrets to GitHub repository**
2. **Ensure `github/workflows/database-backup.yml` is in your repository**
3. **Push to your `staging` branch** (it will automatically activate)

## 📅 Schedule Details

- **Frequency**: Every 2 weeks
- **Time**: Sunday at 2:00 AM UTC
- **Manual Trigger**: Available in GitHub Actions tab
- **Retention**: Keeps last 12 backups (~6 months)

## 📦 Backup Storage

**S3 Location**: `s3://inventory-managment-husseini/database-backups/`

**File Naming**: `phoenix_backup_YYYYMMDD_HHMMSS.sql.gz`

**Example**: `phoenix_backup_20240115_020001.sql.gz`

## 🔍 Monitoring

### Check Backup Status
1. Go to GitHub repository
2. Click "Actions" tab
3. Look for "Weekly Database Backup" workflow runs

### Download Backup
```bash
# From EC2 server
aws s3 cp s3://inventory-managment-husseini/database-backups/phoenix_backup_20240115_020001.sql.gz ./

# Restore from backup
gunzip -c phoenix_backup_20240115_020001.sql.gz | psql -h localhost -U phoenix_user -d phoenix_press
```

## 🧠 Benefits of GitHub Actions vs EC2 Cron

✅ **Advantages:**
- Runs outside your server (no server dependency)
- No impact on application performance
- Automatic cleanup of old backups
- Full audit trail in GitHub
- Easy to trigger manually
- Free (within GitHub limits)

⚠️ **Considerations:**
- Requires database credentials in GitHub secrets
- Runs on GitHub's infrastructure (different IP)
- Need to ensure database allows external connections

## 🔧 Troubleshooting

### If backup fails:

1. **Check database connectivity from GitHub Actions**:
   ```bash
   # Test from EC2 server
   pg_dump -h 13.49.77.209 -U phoenix_user -d phoenix_press
   ```

2. **Verify AWS credentials have S3 permissions**:
   ```bash
   aws s3 ls s3://inventory-managment-husseini/database-backups/
   ```

3. **Check GitHub Actions logs** for specific error messages

### Manual Backup Trigger

To manually trigger a backup:
1. Go to repository → Actions
2. Click "Weekly Database Backup"
3. Click "Run workflow"
4. Select branch → Run

## 💰 Cost Estimation

- **GitHub Actions**: 2 runs/month × ~10 minutes × 2GB RAM = ~$0.20/month
- **S3 Storage**: 12 backups × ~50MB compressed = ~$0.10/month
- **Total**: ~$0.30/month for automated backups

