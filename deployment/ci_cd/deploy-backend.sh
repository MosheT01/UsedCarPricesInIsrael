#!/bin/bash
set -e  # Stop script on error

# Authenticate AWS CLI
echo "🔑 Authenticating to AWS ECR..."
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 440744253098.dkr.ecr.eu-north-1.amazonaws.com

# Navigate to backend folder where Dockerfile is located
echo "📂 Navigating to backend directory..."
cd "$(dirname "$0")/../../backend"

# Build and Push Docker Image with Caching
echo "🐳 Building Docker image with cache..."
docker build --cache-from=usedcar-backend:latest -t usedcar-backend .

echo "🏷️ Tagging Docker image..."
docker tag usedcar-backend:latest 440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest

echo "📤 Pushing Docker image to AWS ECR..."
docker push 440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest

# Navigate back to deployment directory
echo "📂 Returning to project root..."
cd "$(dirname "$0")"

# Deploy to Kubernetes (EKS)
echo "🚀 Updating Kubernetes deployment..."
aws eks --region eu-north-1 update-kubeconfig --name usedcar-cluster
kubectl set image deployment/usedcar-backend usedcar-backend=440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest

echo "✅ Backend deployment complete!"
