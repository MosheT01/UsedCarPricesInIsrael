#!/bin/bash
set -e  # Stop script on error

# Authenticate AWS CLI
echo "🔑 Authenticating to AWS..."
aws configure set region eu-north-1

# Masked Logs to Prevent Secret Exposure
echo "📝 Using S3 Bucket: [REDACTED]"
echo "📝 Using CloudFront Distribution ID: [REDACTED]"

# Validate Environment Variables
if [ -z "$S3_BUCKET_NAME" ]; then
    echo "❌ Error: S3_BUCKET_NAME is not set!"
    exit 1
fi

if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "❌ Error: CLOUDFRONT_DISTRIBUTION_ID is not set!"
    exit 1
fi

# Navigate to frontend directory
echo "📂 Navigating to frontend directory..."
cd "$(dirname "$0")/../../frontend"

# Deploy frontend to S3
echo "🚀 Uploading frontend assets..."
aws s3 sync . s3://"$S3_BUCKET_NAME" --delete > /dev/null 2>&1

# Invalidate CloudFront Cache
echo "🚀 Requesting CloudFront cache invalidation..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" > /dev/null 2>&1

echo "✅ Frontend deployment complete!"
