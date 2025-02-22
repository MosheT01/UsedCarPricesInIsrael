#!/bin/bash
set -e  # Stop script on error

echo "🔑 Authenticating to AWS..."
aws configure list | grep -v "secret_key" 2>/dev/null || echo "⚠️ Error: AWS authentication failed (details hidden)"

echo "📝 Using S3 Bucket and CloudFront (IDs hidden)"
echo "📂 Navigating to frontend directory..."

cd "$(dirname "$0")/../../frontend" || { echo "❌ Error: Failed to navigate to frontend directory"; exit 1; }

echo "🚀 Uploading frontend assets to S3..."
aws s3 sync . "s3://$S3_BUCKET_NAME" --delete --quiet 2>/dev/null || echo "⚠️ Error: S3 upload failed (check permissions)."

echo "🚀 Requesting CloudFront cache invalidation..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" 2>/dev/null || echo "⚠️ Error: CloudFront invalidation failed (check IAM permissions)."

echo "✅ Deployment complete!"
