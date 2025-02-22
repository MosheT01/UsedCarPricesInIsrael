#!/bin/bash
set -e  # Exit on error

echo "🔑 Authenticating to AWS..."
aws configure list || { echo "❌ AWS CLI authentication failed"; exit 1; }

echo "📝 Using S3 Bucket: $S3_BUCKET_NAME"
echo "📝 Using CloudFront Distribution ID: $CLOUDFRONT_DISTRIBUTION_ID"

if [[ -z "$S3_BUCKET_NAME" ]]; then
  echo "❌ Error: S3_BUCKET_NAME is not set!"
  exit 1
fi

if [[ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]]; then
  echo "❌ Error: CLOUDFRONT_DISTRIBUTION_ID is not set!"
  exit 1
fi

echo "📂 Navigating to frontend directory..."
cd "$(dirname "$0")/../../frontend" || { echo "❌ Failed to navigate to frontend directory"; exit 1; }

echo "🚀 Uploading frontend assets to S3..."
aws s3 sync . s3://$S3_BUCKET_NAME --delete || { echo "❌ S3 Upload Failed"; exit 1; }

echo "🚀 Requesting CloudFront cache invalidation..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" || {
  echo "❌ CloudFront cache invalidation failed!"
  exit 254
}

echo "✅ Deployment complete!"
