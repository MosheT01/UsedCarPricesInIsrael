### **CI/CD Pipeline for Deploying Backend to AWS EKS**

This CI/CD pipeline automates the deployment of the **Used Car Prices in Israel** backend to **AWS EKS (Elastic Kubernetes Service)** using **GitHub Actions**, **AWS ECR (Elastic Container Registry)**, and **Kubernetes**.

---

## **🔹 Overview**

- **Source Code Repository**: Hosted on **GitHub**.
- **Containerization**: Backend is built and packaged into a **Docker image**.
- **Container Registry**: The image is pushed to **AWS ECR**.
- **Kubernetes Deployment**: The new image is deployed to **AWS EKS**.
- **Load Balancer**: Kubernetes service is configured as an **internet-facing LoadBalancer**.

---

## **🛠 CI/CD Workflow Components**

The workflow consists of:

1. **GitHub Actions Workflow (`.github/workflows/backend-deploy.yml`)**: Automates deployment when code is pushed to `main`.
2. **Deployment Script (`deploy-backend.sh`)**: Handles AWS authentication, Docker image building, and Kubernetes deployment.
3. **Kubernetes Configuration (`backend-deployment.yaml`)**: Defines deployment and service specifications.

---

## **📌 Step-by-Step Breakdown**

### **1️⃣ GitHub Actions Workflow (backend-deploy.yml)**

Triggered on a **push to the `main` branch**.

#### **🔹 Steps:**

1. **Check Out Repository**

   - Uses `actions/checkout@v4` to clone the repository.

2. **Set Up AWS CLI**

   - Uses `aws-actions/configure-aws-credentials@v2` to authenticate AWS CLI with stored secrets.

3. **Allow Execution for Deployment Script**

   - Grants execution permission to `deploy-backend.sh`.

4. **Run Deployment Script**
   - Executes `deploy-backend.sh`, which handles the deployment.

---

### **2️⃣ Deployment Script (`deploy-backend.sh`)**

This script automates:

1. **AWS Authentication**

   - Logs in to AWS **ECR** using stored credentials.

2. **Docker Image Build & Push**

   - Builds the **Docker image** using a cache from ECR.
   - Pushes the new image to **AWS ECR**.

3. **Deploy to Kubernetes**

   - Updates the **Kubeconfig** for AWS EKS.
   - Deletes the old deployment (if exists).
   - Applies the new Kubernetes deployment configuration (`backend-deployment.yaml`).

4. **Rollout Verification**

   - Waits for the **rollout to complete**.
   - Fetches **pod details** and logs for debugging.

5. **Post-Deployment Health Check**
   - Retrieves the service hostname.
   - Runs a **smoke test** (`curl http://<service-url>/health`).
   - Rolls back the deployment if health check **fails**.

---

### **3️⃣ Kubernetes Deployment Configuration (`backend-deployment.yaml`)**

Defines how the backend is deployed in **AWS EKS**.

#### **🔹 Deployment (`Deployment` resource)**

- **Runs 2 replicas** of the backend container.
- Uses the latest **Docker image** from AWS ECR.
- **Environment variables** (DB credentials) are loaded from **Kubernetes Secrets**.
- **Health checks**:
  - **Liveness probe**: Ensures the app is running (`/health`).
  - **Readiness probe**: Ensures the app is ready to receive traffic.

#### **🔹 Service (`Service` resource)**

- Exposes the backend as a **LoadBalancer** service.
- Redirects traffic from **port 80 → container port 8000**.
- Uses AWS **Application Load Balancer (ALB)**.

---

## **📌 Summary of Deployment Flow**

1. **Push to `main` branch** triggers GitHub Actions.
2. **GitHub Actions** authenticates AWS and runs the deployment script.
3. **Deployment script**:
   - Builds and pushes the **Docker image** to AWS ECR.
   - Deploys the new image to **AWS EKS**.
   - Waits for the deployment to complete.
   - Runs a **health check** to ensure the backend is running.
4. **If successful**, deployment is marked **✅ complete**.
5. **If health check fails**, it **rolls back** the deployment.

---

## **🚀 Key Features**

✅ **Fully Automated** Deployment  
✅ **Secure Deployment** (Uses AWS Secrets, ECR, and Kubernetes Secrets)  
✅ **Health Checks & Rollback** to prevent broken deployments  
✅ **High Availability** with **replica scaling**  
✅ **AWS Load Balancer** for external access

This ensures a **robust, scalable, and reliable** deployment process for the backend. 🚀
