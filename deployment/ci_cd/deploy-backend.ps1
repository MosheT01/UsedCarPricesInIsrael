# Stop script on any error
$ErrorActionPreference = "Stop"

# Authenticate AWS CLI
Write-Host "🔑 Authenticating to AWS ECR..."
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 440744253098.dkr.ecr.eu-north-1.amazonaws.com

# Navigate to backend folder where Dockerfile is located
Write-Host "📂 Navigating to backend directory..."
Set-Location -Path "$PSScriptRoot\..\..\backend"

# Build and Push Docker Image with Caching
Write-Host "🐳 Building Docker image with cache..."
docker build --cache-from=usedcar-backend:latest -t usedcar-backend .

Write-Host "🏷️ Tagging Docker image..."
docker tag usedcar-backend:latest 440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest

Write-Host "📤 Pushing Docker image to AWS ECR..."
docker push 440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest

# Navigate back to deployment directory
Write-Host "📂 Returning to project root..."
Set-Location -Path "$PSScriptRoot"

# Deploy to Kubernetes (EKS)
Write-Host "🚀 Updating Kubernetes deployment..."
aws eks --region eu-north-1 update-kubeconfig --name usedcar-cluster
kubectl set image deployment/usedcar-backend usedcar-backend=440744253098.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest

Write-Host "✅ Backend deployment complete!"
