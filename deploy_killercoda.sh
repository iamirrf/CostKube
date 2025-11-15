#!/bin/bash

# KubeCost - Complete Deployment Script for Killercoda
# Run this in Killercoda playground to deploy everything automatically

set -e

echo "╔════════════════════════════════════════════╗"
echo "║   KubeCost - Complete Setup & Deployment  ║"
echo "║   Free Kubernetes Playground Edition      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found${NC}"
    echo ""
    echo "Please run this in Killercoda:"
    echo "👉 https://killercoda.com/playgrounds/scenario/kubernetes"
    exit 1
fi

echo -e "${GREEN}✅ Kubernetes cluster detected${NC}"
kubectl cluster-info | head -2
echo ""

# Step 1: Metrics Server
echo -e "${BLUE}📊 [1/6] Setting up Metrics Server...${NC}"
if kubectl get deployment metrics-server -n kube-system &> /dev/null; then
    echo -e "${YELLOW}ℹ️  Metrics server already exists${NC}"
else
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml &> /dev/null
    kubectl patch deployment metrics-server -n kube-system --type='json' \
      -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]' &> /dev/null
    echo -e "${GREEN}✅ Metrics server installed${NC}"
fi
echo ""

# Step 2: Wait for metrics server
echo -e "${BLUE}⏳ [2/6] Waiting for metrics server...${NC}"
kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=120s &> /dev/null || {
    echo -e "${YELLOW}⚠️  Continuing anyway...${NC}"
}
sleep 10
echo -e "${GREEN}✅ Metrics server ready${NC}"
echo ""

# Step 3: Create sample workloads
echo -e "${BLUE}🏗️  [3/6] Creating sample workloads...${NC}"

# Create namespaces
for ns in production development staging; do
    kubectl create namespace $ns 2>/dev/null || echo -e "${YELLOW}  • $ns namespace exists${NC}"
done

# Production
kubectl create deployment nginx --image=nginx --replicas=3 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
kubectl create deployment redis --image=redis --replicas=2 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
kubectl create deployment postgres --image=postgres:alpine --replicas=1 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null

# Development
kubectl create deployment webapp --image=nginx --replicas=2 -n development --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
kubectl create deployment api --image=nginx --replicas=2 -n development --dry-run=client -o yaml | kubectl apply -f - &> /dev/null

# Staging
kubectl create deployment test-app --image=nginx --replicas=1 -n staging --dry-run=client -o yaml | kubectl apply -f - &> /dev/null

echo -e "${GREEN}✅ Sample workloads created${NC}"
echo ""

# Step 4: Install dependencies
echo -e "${BLUE}📦 [4/6] Installing Python dependencies...${NC}"
if ! command -v pip3 &> /dev/null; then
    apt-get update &> /dev/null
    apt-get install -y python3-pip git &> /dev/null
fi
echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""

# Step 5: Clone and setup KubeCost
echo -e "${BLUE}🚀 [5/6] Setting up CostKube application...${NC}"
if [ -d "CostKube" ]; then
    echo -e "${YELLOW}ℹ️  CostKube directory exists, updating...${NC}"
    cd CostKube
    git pull &> /dev/null || echo -e "${YELLOW}  Could not pull updates${NC}"
else
    git clone https://github.com/iamirrf/CostKube.git &> /dev/null
    cd CostKube
fi

pip3 install -r requirements.txt &> /dev/null
echo -e "${GREEN}✅ CostKube application ready${NC}"
echo ""

# Step 6: Verify metrics
echo -e "${BLUE}📈 [6/6] Verifying cluster metrics...${NC}"
sleep 5

if kubectl top nodes &> /dev/null; then
    echo -e "${GREEN}✅ Metrics available${NC}"
    echo ""
    kubectl top nodes
    echo ""
else
    echo -e "${YELLOW}⚠️  Metrics not yet ready (may take 1-2 minutes)${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║          🎉 SETUP COMPLETE! 🎉             ║"
echo "╚════════════════════════════════════════════╝"
echo ""

echo -e "${BLUE}📊 Cluster Overview:${NC}"
kubectl get nodes
echo ""
kubectl get pods --all-namespaces | grep -E "production|development|staging|NAMESPACE" | head -15
echo ""

echo "╔════════════════════════════════════════════╗"
echo "║          🚀 START KUBECOST APP             ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Run the following command:${NC}"
echo ""
echo -e "${BLUE}  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000${NC}"
echo ""
echo "Then click the port 8000 access button in Killercoda!"
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║          📖 USEFUL COMMANDS                ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "View cluster metrics:"
echo "  kubectl top nodes"
echo "  kubectl top pods --all-namespaces"
echo ""
echo "Check app status:"
echo "  curl http://localhost:8000/api/config"
echo ""
echo "View namespaces with costs:"
echo "  curl http://localhost:8000/api/namespaces"
echo ""
