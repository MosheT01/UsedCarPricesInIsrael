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

# ✅ Apply the latest Kubernetes deployment file
echo "🛠️ Applying the latest Kubernetes Deployment..."
kubectl delete deployment usedcar-backend --ignore-not-found=true
kubectl apply -f backend-deployment.yaml

# ✅ Ensure rollout completes successfully before proceeding
echo "🚀 Waiting for rollout to complete..."
if ! kubectl rollout status deployment/usedcar-backend; then
    echo "❌ Deployment failed! Rolling back..."
    kubectl rollout undo deployment usedcar-backend
    exit 1
fi

# ✅ Verify pod status to confirm correct health check configuration
echo "🔍 Verifying pod details..."
kubectl describe pod $(kubectl get pod -l app=usedcar-backend -o jsonpath="{.items[0].metadata.name}")

# ✅ Retrieve logs in case of debugging needs
echo "📜 Fetching latest logs from the backend pod..."
kubectl logs -l app=usedcar-backend --tail=50

# ✅ Post-deployment smoke test to check if service is reachable
echo "🔍 Running post-deployment smoke test..."
SERVICE_HOST=$(kubectl get svc backend-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
if curl -f "http://$SERVICE_HOST/health"; then
    echo "✅ Service is up and running!"
else
    echo "❌ Service health check failed! Rolling back..."
    kubectl rollout undo deployment usedcar-backend
    exit 1
fi

echo "✅ Backend deployment complete!"
