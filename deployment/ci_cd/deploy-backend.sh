#!/bin/bash
set -e  # Stop script on error

# Authenticate AWS CLI
echo "🔑 Authenticating to AWS ECR..."
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 440744253098.dkr.ecr.eu-north-1.amazonaws.com

# Navigate to backend folder where Dockerfile is located
echo "📂 Navigating to backend directory..."
cd "$(dirname "$0")/../../backend"

# Ensure AWS ECR repository is used for caching
echo "🐳 Building Docker image with cache..."
docker build --cache-from=440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest \
             -t 440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest .

echo "📤 Pushing Docker image to AWS ECR..."
docker push 440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest

# Navigate back to deployment directory
echo "📂 Returning to deployment directory..."
cd "$(git rev-parse --show-toplevel)/deployment" || exit 1

# Deploy to Kubernetes (EKS)
echo "🚀 Updating Kubernetes deployment..."
aws eks --region eu-north-1 update-kubeconfig --name usedcar-cluster
kubectl set image deployment/usedcar-backend usedcar-backend=440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest

echo "✅ Backend deployment complete!"
