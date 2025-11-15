#!/bin/bash

# KubeCost - Killercoda Free Kubernetes Setup Script
# This script sets up a complete environment in Killercoda playground

set -e

echo "🚀 KubeCost - Killercoda Setup"
echo "================================"
echo ""

# Check if we're in Killercoda (or any K8s cluster)
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Error: kubectl not found or cluster not accessible"
    echo ""
    echo "Please run this script in Killercoda terminal:"
    echo "👉 https://killercoda.com/playgrounds/scenario/kubernetes"
    exit 1
fi

echo "✅ Kubernetes cluster detected"
kubectl cluster-info
echo ""

# Step 1: Deploy Metrics Server
echo "📊 Step 1: Installing Metrics Server..."
if kubectl get deployment metrics-server -n kube-system &> /dev/null; then
    echo "ℹ️  Metrics server already exists, skipping installation"
else
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

    # Patch for insecure TLS (required for playground environments)
    echo "🔧 Patching metrics-server for playground environment..."
    kubectl patch deployment metrics-server -n kube-system --type='json' \
      -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

    echo "⏳ Waiting for metrics-server to be ready..."
    kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=120s || {
        echo "⚠️  Metrics server taking longer than expected, continuing anyway..."
    }
fi
echo ""

# Step 2: Create Sample Namespaces
echo "🏗️  Step 2: Creating sample namespaces..."
for ns in production development staging; do
    if kubectl get namespace $ns &> /dev/null; then
        echo "ℹ️  Namespace '$ns' already exists, skipping"
    else
        kubectl create namespace $ns
        echo "✅ Created namespace: $ns"
    fi
done
echo ""

# Step 3: Deploy Sample Workloads
echo "🚢 Step 3: Deploying sample applications..."

# Production workloads
kubectl create deployment nginx --image=nginx --replicas=3 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
kubectl create deployment redis --image=redis --replicas=2 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
kubectl create deployment postgres --image=postgres --replicas=1 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
echo "✅ Deployed production workloads"

# Development workloads
kubectl create deployment webapp --image=nginx --replicas=2 -n development --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
kubectl create deployment api --image=nginx --replicas=2 -n development --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
echo "✅ Deployed development workloads"

# Staging workloads
kubectl create deployment test-app --image=nginx --replicas=1 -n staging --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
echo "✅ Deployed staging workloads"
echo ""

# Step 4: Wait for pods to be ready
echo "⏳ Step 4: Waiting for pods to be ready..."
sleep 20

echo ""
echo "📈 Verifying metrics availability..."
sleep 5

if kubectl top nodes &> /dev/null; then
    echo "✅ Node metrics available:"
    kubectl top nodes
else
    echo "⚠️  Node metrics not yet available (this is normal, may take 1-2 minutes)"
fi

echo ""
if kubectl top pods --all-namespaces &> /dev/null; then
    echo "✅ Pod metrics available:"
    kubectl top pods --all-namespaces | head -10
else
    echo "⚠️  Pod metrics not yet available (this is normal, may take 1-2 minutes)"
fi

echo ""
echo "================================"
echo "✅ Kubernetes Setup Complete!"
echo "================================"
echo ""
echo "📊 Cluster Status:"
kubectl get nodes
echo ""
kubectl get pods --all-namespaces | grep -E "production|development|staging|NAMESPACE"
echo ""

echo "🔗 Next Steps:"
echo ""
echo "Option A - Deploy KubeCost in this cluster:"
echo "  git clone https://github.com/iamirrf/kubecost.git"
echo "  cd kubecost"
echo "  pip3 install -r requirements.txt"
echo "  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "Option B - Connect from your local machine:"
echo "  1. Copy kubeconfig: cat ~/.kube/config"
echo "  2. Save it locally to ~/.kube/killercoda/config"
echo "  3. Run: export KUBECONFIG=~/.kube/killercoda/config"
echo "  4. Test: kubectl get nodes"
echo "  5. Start app locally: python3 -m uvicorn app.main:app --reload"
echo ""
echo "🌐 Access the app at:"
echo "  - Killercoda: Use the port 8000 access URL from Killercoda UI"
echo "  - Local: http://localhost:8000"
echo ""
