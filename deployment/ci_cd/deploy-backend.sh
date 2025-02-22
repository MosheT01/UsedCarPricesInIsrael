#!/bin/bash
set -e  # Stop script on error

# Authenticate to AWS ECR securely
echo "🔑 Authenticating to AWS ECR..."
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 440744253098.dkr.ecr.eu-north-1.amazonaws.com > /dev/null 2>&1 || {
    echo "⚠️ Error: AWS ECR login failed (check permissions)."
    exit 1
}

# Navigate to backend directory where Dockerfile is located
echo "📂 Navigating to backend directory..."
cd "$(dirname "$0")/../../backend" || {
    echo "❌ Error: Backend directory not found!"
    exit 1
}

# Ensure AWS ECR repository is used for caching to speed up builds
echo "🐳 Building Docker image with cache..."
docker build --cache-from=440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest \
             -t 440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest . > /dev/null || {
    echo "⚠️ Error: Docker build failed."
    exit 1
}

# Push Docker image to AWS ECR
echo "📤 Pushing Docker image to AWS ECR..."
docker push 440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest > /dev/null || {
    echo "⚠️ Error: Docker push failed."
    exit 1
}

# Navigate back to deployment directory
echo "📂 Returning to deployment directory..."
cd "$(git rev-parse --show-toplevel)/deployment" || {
    echo "❌ Error: Failed to navigate to deployment directory!"
    exit 1
}

# Deploy to Kubernetes (EKS)
echo "🚀 Updating Kubernetes deployment..."
aws eks --region eu-north-1 update-kubeconfig --name usedcar-cluster > /dev/null || {
    echo "⚠️ Error: EKS update failed."
    exit 1
}

# Apply the latest Kubernetes deployment file
echo "🛠️ Applying the latest Kubernetes Deployment..."
kubectl delete deployment usedcar-backend --ignore-not-found=true > /dev/null
kubectl apply -f backend-deployment.yaml > /dev/null || {
    echo "⚠️ Error: Kubernetes deployment failed."
    exit 1
}

# Ensure rollout completes successfully before proceeding
echo "🚀 Waiting for rollout to complete..."
if ! kubectl rollout status deployment/usedcar-backend > /dev/null; then
    echo "❌ Deployment failed! Rolling back..."
    kubectl rollout undo deployment usedcar-backend > /dev/null
    exit 1
fi

# Verify pod status to confirm correct health check configuration
echo "🔍 Verifying pod details..."
POD_NAME=$(kubectl get pod -l app=usedcar-backend -o jsonpath="{.items[0].metadata.name}")
kubectl describe pod "$POD_NAME" > /dev/null || {
    echo "⚠️ Error: Failed to retrieve pod details."
}

# Retrieve logs in case of debugging needs
echo "📜 Fetching latest logs from the backend pod..."
kubectl logs -l app=usedcar-backend --tail=50 > /dev/null || {
    echo "⚠️ Warning: No logs found or access denied."
}

# Post-deployment smoke test to check if service is reachable
echo "🔍 Running post-deployment smoke test..."
SERVICE_HOST=$(kubectl get svc backend-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
if curl -s -o /dev/null -w "%{http_code}" "http://$SERVICE_HOST/api/health" | grep -q "200"; then
    echo "✅ Service is up and running!"
else
    echo "❌ Service health check failed! Rolling back..."
    kubectl rollout undo deployment usedcar-backend > /dev/null
    exit 1
fi

echo "✅ Backend deployment complete!"
