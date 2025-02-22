#!/bin/bash
set -e  # Stop script on error

# Authenticate AWS CLI
echo "🔑 Authenticating to AWS..."
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set region eu-north-1

# Navigate to frontend directory
echo "📂 Navigating to frontend directory..."
cd "$(dirname "$0")/../../frontend"

# Deploy frontend to S3
echo "🚀 Uploading frontend to S3..."
aws s3 sync . s3://${S3_BUCKET_NAME} --delete

# Invalidate CloudFront Cache
echo "🚀 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "✅ Frontend deployment complete!"
