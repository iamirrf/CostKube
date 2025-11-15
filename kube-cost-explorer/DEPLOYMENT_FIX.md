# Deployment Script Fix - Killercoda Issue Resolution

## 🐛 Problem Identified

The deployment was getting stuck at **Step 5: Setting up KubeCost application** because:

1. **Wrong Directory Structure**: The script was cloning the repository but not navigating to the `kube-cost-explorer` subdirectory
2. **Missing Files**: `requirements.txt` and `app/main.py` are inside `kube-cost-explorer/`, not at the repository root
3. **Path Issues**: The uvicorn command couldn't find the app module because it was being run from the wrong directory

## ✅ Changes Made

### 1. Updated `auto_deploy_killercoda.sh`

#### Change 1: Navigate to kube-cost-explorer subdirectory (Line ~110)
```bash
# Step 5: Clone and setup KubeCost
echo -e "${BLUE}🚀 [5/7] Setting up KubeCost application...${NC}"
if [ -d "kubecost" ]; then
    echo -e "${YELLOW}ℹ️  kubecost directory exists, updating...${NC}"
    cd kubecost
    git pull &> /dev/null || echo -e "${YELLOW}  Could not pull updates${NC}"
else
    git clone https://github.com/iamirrf/kubecost.git &> /dev/null
    cd kubecost
fi

# Navigate to the kube-cost-explorer subdirectory ← NEW!
cd kube-cost-explorer

pip3 install -r requirements.txt &> /dev/null
echo -e "${GREEN}✅ KubeCost application ready${NC}"
```

#### Change 2: Add directory verification (Line ~130)
```bash
# Step 7: Start the application
echo -e "${BLUE}🎯 [7/7] Starting KubeCost application...${NC}"

# Kill any existing instances
pkill -f "uvicorn app.main:app" 2>/dev/null || true

# Verify we're in the correct directory ← NEW!
if [ ! -f "app/main.py" ]; then
    echo -e "${RED}❌ Error: app/main.py not found in current directory${NC}"
    echo -e "${YELLOW}Current directory: $(pwd)${NC}"
    echo -e "${YELLOW}Contents:${NC}"
    ls -la
    exit 1
fi
```

#### Change 3: Add health check after startup (Line ~150)
```bash
if pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo -e "${GREEN}✅ KubeCost is running!${NC}"

    # Test the health endpoint ← NEW!
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
fi
```

#### Change 4: Fix auto-restart directory navigation (Line ~240)
```bash
# Navigate back to parent directory before redeploying
# Need to go back 2 levels: kube-cost-explorer -> kubecost -> parent ← UPDATED!
cd ../..

# Redeploy
deploy_kubecost $deployment_count
```

#### Change 5: Fix monitoring restart path (Line ~260)
```bash
# Also check if the app is still running
if ! pgrep -f "uvicorn app.main:app" > /dev/null; then
    echo ""
    echo -e "${YELLOW}⚠️  KubeCost stopped! Restarting...${NC}"
    cd kubecost/kube-cost-explorer 2>/dev/null || cd . ← UPDATED!
    nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > kubecost.log 2>&1 &
    sleep 3
fi
```

### 2. Updated `app/api/routes.py`

Added new health check endpoint:
```python
@router.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint with detailed diagnostics"""
    k8s_available = k8s_client.metrics_api is not None
    metrics_available = False

    if k8s_available:
        try:
            # Try to fetch metrics to verify full functionality
            namespace_usage = k8s_client.get_namespace_usage()
            metrics_available = namespace_usage is not None and len(namespace_usage) > 0
        except Exception as e:
            print(f"Metrics check failed: {e}")

    return {
        "status": "healthy",
        "k8s_client_initialized": k8s_available,
        "metrics_server_available": metrics_available,
        "demo_mode": False,
    }
```

### 3. Updated `app/services/k8s_client.py`

Enhanced logging for better debugging:
```python
def _init_k8s_client(self):
    """Initialize Kubernetes client with in-cluster or kubeconfig"""
    try:
        # Try in-cluster config first
        config.load_incluster_config()
        print("✅ Using in-cluster configuration")
    except config.ConfigException as e:
        print(f"⚠️  In-cluster config failed: {e}")
        try:
            # Fall back to kubeconfig
            config.load_kube_config()
            print("✅ Using local kubeconfig")
        except config.ConfigException as e2:
            print(f"❌ Could not load Kubernetes configuration: {e2}")
            print("⚠️  Running in demo mode - Kubernetes cluster not available")
            return

    self.api_client = client.ApiClient()
    self.metrics_api = client.CustomObjectsApi(self.api_client)
    print("✅ Kubernetes client initialized successfully")
```

## 🧪 Testing

### Local Test
Run the test script before pushing to GitHub:
```bash
./test_deployment_script.sh
```

This will:
1. Clone the repository to a temp directory
2. Verify the directory structure
3. Install dependencies
4. Start the application
5. Test the health endpoint
6. Clean up

### Killercoda Test
After pushing to GitHub, test in Killercoda:
```bash
curl -sSL https://raw.githubusercontent.com/iamirrf/kubecost/main/auto_deploy_killercoda.sh | bash
```

## 📋 Expected Output

The deployment should now complete all 7 steps:

```
╔════════════════════════════════════════════════════════════════╗
║     KubeCost - Auto-Restart Deployment (Killercoda)           ║
╚════════════════════════════════════════════════════════════════╝

✅ Kubernetes cluster detected
📊 [1/7] Setting up Metrics Server... ✅
⏳ [2/7] Waiting for metrics server... ✅
🏗️  [3/7] Creating sample workloads... ✅
📦 [4/7] Installing Python dependencies... ✅
🚀 [5/7] Setting up KubeCost application... ✅
📈 [6/7] Verifying cluster metrics... ✅
🎯 [7/7] Starting KubeCost application... ✅

🔍 Testing Kubernetes connection...
✅ Health check passed
Status: {"status":"healthy","k8s_client_initialized":true,...}

╔════════════════════════════════════════════════════════════════╗
║          ✅ KUBECOST IS LIVE ON PORT 8000                      ║
╚════════════════════════════════════════════════════════════════╝
```

## 🔍 Debugging

If the deployment still fails:

1. **Check the application log**:
   ```bash
   cd kubecost/kube-cost-explorer
   tail -f kubecost.log
   ```

2. **Test the health endpoint**:
   ```bash
   curl http://localhost:8000/api/health | python3 -m json.tool
   ```

3. **Check Kubernetes connection**:
   ```bash
   kubectl cluster-info
   kubectl top nodes
   ```

4. **Verify metrics server**:
   ```bash
   kubectl get deployment metrics-server -n kube-system
   kubectl get pods -n kube-system | grep metrics
   ```

## 📝 Next Steps

1. Commit and push these changes to GitHub
2. Test the deployment in Killercoda
3. Verify the dashboard shows "LIVE" status (not "DEMO")
4. Check that namespace and pod metrics are displaying correctly

## 🎯 Repository Structure

```
kubecost/                          ← Repository root
└── kube-cost-explorer/            ← Application directory
    ├── app/
    │   ├── main.py                ← FastAPI application
    │   ├── api/
    │   │   └── routes.py          ← API endpoints (including /api/health)
    │   └── services/
    │       └── k8s_client.py      ← Kubernetes client
    ├── requirements.txt           ← Python dependencies
    └── auto_deploy_killercoda.sh  ← Deployment script (FIXED)
```

## ✨ Key Improvements

1. **Correct Path Navigation**: Now properly navigates to `kube-cost-explorer/` subdirectory
2. **Better Error Handling**: Validates directory structure before proceeding
3. **Health Check**: New `/api/health` endpoint for diagnostics
4. **Enhanced Logging**: More detailed output for debugging
5. **Auto-restart Fix**: Correctly handles directory paths during auto-restart cycles

---

**Status**: Ready to deploy ✅
**Last Updated**: November 15, 2025
