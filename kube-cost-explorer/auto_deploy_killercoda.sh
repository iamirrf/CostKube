#!/bin/bash

# KubeCost - Auto-Restart Deployment Script for Killercoda
# This script automatically restarts the deployment when session expires

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     KubeCost - Auto-Restart Deployment (Killercoda)           ║"
echo "║     This will keep redeploying automatically every hour       ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Function to deploy KubeCost
deploy_kubecost() {
    local deployment_num=$1

    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🚀 Starting Deployment #${deployment_num}${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""

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
    echo -e "${BLUE}📊 [1/7] Setting up Metrics Server...${NC}"
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
    echo -e "${BLUE}⏳ [2/7] Waiting for metrics server...${NC}"
    kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=120s &> /dev/null || {
        echo -e "${YELLOW}⚠️  Continuing anyway...${NC}"
    }
    sleep 10
    echo -e "${GREEN}✅ Metrics server ready${NC}"
    echo ""

    # Step 3: Create sample workloads
    echo -e "${BLUE}🏗️  [3/7] Creating sample workloads...${NC}"

    # Create namespaces
    for ns in production development staging; do
        kubectl create namespace $ns 2>/dev/null || echo -e "${YELLOW}  • $ns namespace exists${NC}"
    done

    # Production workloads
    kubectl create deployment nginx --image=nginx --replicas=3 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
    kubectl create deployment redis --image=redis --replicas=2 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
    kubectl create deployment postgres --image=postgres:alpine --replicas=1 -n production --dry-run=client -o yaml | kubectl apply -f - &> /dev/null

    # Development workloads
    kubectl create deployment webapp --image=nginx --replicas=2 -n development --dry-run=client -o yaml | kubectl apply -f - &> /dev/null
    kubectl create deployment api --image=nginx --replicas=2 -n development --dry-run=client -o yaml | kubectl apply -f - &> /dev/null

    # Staging workloads
    kubectl create deployment test-app --image=nginx --replicas=1 -n staging --dry-run=client -o yaml | kubectl apply -f - &> /dev/null

    echo -e "${GREEN}✅ Sample workloads created${NC}"
    echo ""

    # Step 4: Install dependencies
    echo -e "${BLUE}📦 [4/7] Installing Python dependencies...${NC}"
    if ! command -v pip3 &> /dev/null; then
        apt-get update &> /dev/null
        apt-get install -y python3-pip git &> /dev/null
    fi
    echo -e "${GREEN}✅ Dependencies ready${NC}"
    echo ""

    # Step 5: Clone and setup KubeCost
    echo -e "${BLUE}🚀 [5/7] Setting up CostKube application...${NC}"
    if [ -d "CostKube" ]; then
        echo -e "${YELLOW}ℹ️  CostKube directory exists, updating...${NC}"
        cd CostKube
        git pull &> /dev/null || echo -e "${YELLOW}  Could not pull updates${NC}"
    else
        git clone https://github.com/iamirrf/CostKube.git &> /dev/null
        cd CostKube
    fi

    # Navigate to the kube-cost-explorer subdirectory
    cd kube-cost-explorer

    pip3 install -r requirements.txt &> /dev/null
    echo -e "${GREEN}✅ CostKube application ready${NC}"
    echo ""

    # Step 6: Verify metrics
    echo -e "${BLUE}📈 [6/7] Verifying cluster metrics...${NC}"
    sleep 5

    if kubectl top nodes &> /dev/null; then
        echo -e "${GREEN}✅ Metrics available${NC}"
    else
        echo -e "${YELLOW}⚠️  Metrics not yet ready (may take 1-2 minutes)${NC}"
    fi
    echo ""

    # Step 7: Start the application
    echo -e "${BLUE}🎯 [7/7] Starting KubeCost application...${NC}"

    # Kill any existing instances
    pkill -f "uvicorn app.main:app" 2>/dev/null || true

    # Verify we're in the correct directory
    if [ ! -f "app/main.py" ]; then
        echo -e "${RED}❌ Error: app/main.py not found in current directory${NC}"
        echo -e "${YELLOW}Current directory: $(pwd)${NC}"
        echo -e "${YELLOW}Contents:${NC}"
        ls -la
        exit 1
    fi

    # Start in background with auto-restart
    nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > kubecost.log 2>&1 &

    sleep 3

    if pgrep -f "uvicorn app.main:app" > /dev/null; then
        echo -e "${GREEN}✅ KubeCost is running!${NC}"

        # Test the health endpoint
        sleep 2
        echo ""
        echo -e "${BLUE}🔍 Testing Kubernetes connection...${NC}"
        if curl -s http://localhost:8000/api/health | grep -q "k8s_client_initialized"; then
            health_status=$(curl -s http://localhost:8000/api/health)
            echo -e "${GREEN}✅ Health check passed${NC}"
            echo -e "${YELLOW}Status: ${health_status}${NC}"
        else
            echo -e "${YELLOW}⚠️  Could not verify health endpoint${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to start KubeCost${NC}"
        echo "Check logs: tail -f kubecost.log"
        echo ""
        echo "Last 20 lines of log:"
        tail -20 kubecost.log 2>/dev/null || echo "No log file found"
    fi
    echo ""

    # Display status
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║          🎉 DEPLOYMENT #${deployment_num} COMPLETE! 🎉                       ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    echo -e "${BLUE}📊 Cluster Overview:${NC}"
    kubectl get nodes
    echo ""
    kubectl get pods --all-namespaces | grep -E "production|development|staging|NAMESPACE" | head -15
    echo ""

    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║          ✅ KUBECOST IS LIVE ON PORT 8000                      ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}Click 'Access Port 8000' in Killercoda to view the dashboard!${NC}"
    echo ""
    echo -e "${CYAN}Application logs:${NC} tail -f kubecost.log"
    echo -e "${CYAN}Test API:${NC} curl http://localhost:8000/api/config"
    echo ""
}

# Function to monitor and auto-restart
auto_monitor() {
    deployment_count=1

    # Initial deployment
    deploy_kubecost $deployment_count

    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║          🔄 AUTO-RESTART MODE ENABLED                          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${YELLOW}The script will monitor the session and redeploy automatically.${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop auto-restart mode.${NC}"
    echo ""

    # Get start time
    start_time=$(date +%s)

    while true; do
        sleep 60  # Check every minute

        # Calculate elapsed time
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        remaining=$((3600 - elapsed))

        # Display countdown
        minutes_remaining=$((remaining / 60))
        seconds_remaining=$((remaining % 60))

        echo -ne "\r${CYAN}⏱️  Session time remaining: ${minutes_remaining}m ${seconds_remaining}s${NC}  "

        # Check if session is about to expire (less than 2 minutes remaining)
        if [ $remaining -lt 120 ]; then
            echo ""
            echo ""
            echo -e "${YELLOW}⚠️  Session expiring soon! Preparing for redeploy...${NC}"
            echo ""
            echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
            echo -e "${RED}   KILLERCODA SESSION EXPIRED - RESTARTING...${NC}"
            echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
            echo ""
            sleep 5

            # Increment deployment counter
            deployment_count=$((deployment_count + 1))

            # Navigate back to parent directory before redeploying
            # Need to go back 2 levels: kube-cost-explorer -> kubecost -> parent
            cd ../..

            # Redeploy
            deploy_kubecost $deployment_count

            # Reset start time
            start_time=$(date +%s)
        fi

        # Also check if the app is still running
        if ! pgrep -f "uvicorn app.main:app" > /dev/null; then
            echo ""
            echo -e "${YELLOW}⚠️  KubeCost stopped! Restarting...${NC}"
            cd kubecost/kube-cost-explorer 2>/dev/null || cd .
            nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > kubecost.log 2>&1 &
            sleep 3
        fi
    done
}

# Main execution
case "${1:-auto}" in
    auto)
        auto_monitor
        ;;
    once)
        deploy_kubecost 1
        ;;
    *)
        echo "Usage: $0 [auto|once]"
        echo "  auto  - Auto-restart mode (default)"
        echo "  once  - Deploy once and exit"
        exit 1
        ;;
esac
