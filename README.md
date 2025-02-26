[![Deploy Backend to AWS EKS](https://github.com/MosheT01/UsedCarPricesInIsrael/actions/workflows/backend-deploy.yml/badge.svg)](https://github.com/MosheT01/UsedCarPricesInIsrael/actions/workflows/backend-deploy.yml)
# UsedCarPricesInIsrael

## 📌 Project Overview
UsedCarPricesInIsrael is a full-stack web application that provides insights into used car prices in Israel. The system features a scalable backend, a user-friendly frontend, and a structured database. The entire system is deployed on AWS, utilizing EKS for container orchestration and RDS for database management.

---
## 🎯 Project Goals
- Deploy a scalable backend on AWS using Kubernetes (EKS).
- Store and manage used car price data in a cloud database (AWS RDS).
- Provide an interactive frontend to visualize and query car price data.
- Automate deployment with CI/CD pipelines.
- Ensure high availability and security using best practices.

---
## 🏗️ Tech Stack
### **Frontend**
- **HTML, CSS, JavaScript**
- **Framework:** React (TBD)
- **Hosting:** AWS S3 + CloudFront (TBD)

### **Backend**
- **Language:** Python (FastAPI)
- **Database:** MySQL (AWS RDS)
- **Infrastructure:** Docker, Kubernetes (EKS)
- **Container Registry:** AWS ECR
- **Deployment:** AWS EKS (Kubernetes)
- **CI/CD:** GitHub Actions

---
## 🛠️ Features & Implementations
### ✅ Backend
- FastAPI service with endpoints for fetching filtered car data.
- API hosted using Uvicorn with containerized deployment.
- Connection to AWS RDS for database queries.
- Deployed on AWS EKS with Kubernetes LoadBalancer.

### ✅ Frontend (WIP)
- Dynamic UI for fetching and displaying car prices.
- Fetches data from the backend API.
- Hosted on AWS S3 & served via CloudFront (pending).

### ✅ Database
- AWS RDS MySQL instance for car price storage.
- Connected securely to the backend through private networking.
- Restricted public access to enhance security.

### ✅ Infrastructure
- Deployed using AWS EKS for container orchestration.
- Automated CI/CD with GitHub Actions.
- Docker images stored & managed on AWS ECR.
- Kubernetes LoadBalancer for external accessibility.

---
## 🚀 Deployment Guide

### 1️⃣ **Setup AWS Environment**
Ensure you have the following AWS resources ready:
- **AWS EKS cluster** (`usedcar-cluster`)
- **AWS RDS instance** (`carsdevopsfinalproject`)
- **AWS ECR repository** (`usedcar-backend`)
- **IAM roles with necessary permissions**

### 2️⃣ **Backend Deployment**
#### **1. Authenticate AWS CLI & Docker**
```sh
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com
```

#### **2. Build and Push Docker Image**
```sh
cd backend
docker build -t usedcar-backend .
docker tag usedcar-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com/usedcar-backend:latest
```

#### **3. Deploy to Kubernetes (EKS)**
```sh
aws eks --region eu-north-1 update-kubeconfig --name usedcar-cluster
kubectl apply -f deployment/backend-deployment.yaml
```

### 3️⃣ **CI/CD Pipeline (GitHub Actions)**
Automates backend deployment on every push to `main` branch.
- Build & Push Docker Image to AWS ECR.
- Update Kubernetes deployment in AWS EKS.

#### **Manually Trigger Deployment**
```sh
git push origin main
```
The pipeline will automatically deploy the latest backend version.

---
## 📊 Status
- [x] Backend service running on AWS EKS.
- [x] Database connected securely to Kubernetes.
- [x] LoadBalancer setup for external access.
- [x] GitHub Actions CI/CD pipeline configured.
- [x] Frontend development in progress.
- [x] Static content deployment to AWS S3 & CloudFront.

---
## 🤝 Contributing
Pull requests are welcome! Open an issue for feature requests or bug reports.

---
## 📧 Contact
For any inquiries, please contact:
- **Developer:** [Mousa Tams](https://github.com/MosheT01)
- **Developer:** [Shadi Kouba](https://github.com/ShadiKouba)
  


