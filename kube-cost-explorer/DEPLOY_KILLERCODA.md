# KubeCost - Free Cloud Deployment Guide

## 🎯 Deploy to Killercoda (Free Kubernetes Playground)

This guide will help you deploy KubeCost to a **100% FREE** Kubernetes cluster in your browser - no installation, no credit card needed!

---

## Quick Start (2 Minutes)

### Step 1: Open Killercoda Playground

Visit: **<https://killercoda.com/playgrounds/scenario/kubernetes>**

Click **"Start"** (no login required)

Wait 30 seconds for the cluster to initialize.

### Step 2: Run Deployment Script

Copy and paste this ONE command into the Killercoda terminal:

```bash
curl -sSL https://raw.githubusercontent.com/iamirrf/kubecost/main/kube-cost-explorer/deploy_killercoda.sh | bash
```

This will:

- ✅ Install metrics-server
- ✅ Create sample workloads (nginx, redis, postgres, etc.)
- ✅ Clone KubeCost repository
- ✅ Install Python dependencies
- ✅ Verify cluster is ready

### Step 3: Start KubeCost

Once the script completes, run:

```bash
cd kubecost/kube-cost-explorer
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Step 4: Access Dashboard

In Killercoda, you'll see a button labeled **"Traffic / Ports"** or **"Access Port 8000"**

Click it to open the KubeCost dashboard!

---

## 🎉 What You'll See

The dashboard will show **REAL Kubernetes data** from the cluster:

- **Real-time namespace costs** (production, development, staging)
- **Pod-level cost breakdown**
- **CPU and memory usage metrics**
- **Monthly cost projections**
- **Interactive charts and visualizations**

All powered by actual metrics from the Kubernetes cluster running in Killercoda!

---

## 📊 Sample Workloads Deployed

The deployment script creates these workloads for you:

| Namespace   | Workload  | Replicas | Resources            |
|-------------|-----------|----------|----------------------|
| production  | nginx     | 3        | 100m CPU, 128Mi RAM  |
| production  | redis     | 2        | 50m CPU, 64Mi RAM    |
| production  | postgres  | 1        | 200m CPU, 256Mi RAM  |
| development | webapp    | 2        | 50m CPU, 64Mi RAM    |
| development | api       | 2        | 100m CPU, 128Mi RAM  |
| staging     | test-app  | 1        | 25m CPU, 32Mi RAM    |

---

## 🔧 Useful Commands

### Verify Cluster Metrics

```bash
# Check node metrics
kubectl top nodes

# Check pod metrics
kubectl top pods --all-namespaces

# List all pods
kubectl get pods --all-namespaces
```

### Test API Endpoints

```bash
# Check configuration
curl http://localhost:8000/api/config | python3 -m json.tool

# Get namespace costs
curl http://localhost:8000/api/namespaces | python3 -m json.tool

# Get pod costs
curl http://localhost:8000/api/pods | python3 -m json.tool
```

### View Interactive API Docs

Open: `http://localhost:8000/docs`

(Use the Killercoda port access button)

---

## 🔄 Session Limits

**Killercoda sessions last 1 hour**, then automatically reset.

Don't worry! Just restart the deployment:

1. Click "Start" again on Killercoda
2. Re-run the deployment script
3. Start the app

Takes less than 2 minutes to redeploy!

---

## 🌐 Alternative: Deploy Your Local Cluster

If you prefer to use your own Kubernetes cluster:

```bash
# Clone the repo
git clone https://github.com/iamirrf/kubecost.git
cd kubecost/kube-cost-explorer

# Install dependencies
pip install -r requirements.txt

# Make sure you're connected to your cluster
kubectl cluster-info

# Run the app
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open: <http://localhost:8000>

---

## 📚 More Resources

- **GitHub Repository**: <https://github.com/iamirrf/kubecost>
- **Static Demo**: <https://iamirrf.github.io/kubecost/>
- **Full Documentation**: See README.md
- **Quick Start Guide**: See QUICKSTART.md

---

## 🐛 Troubleshooting

### Metrics Not Showing

Wait 1-2 minutes after deployment for metrics to populate.

```bash
kubectl top nodes
```

If this fails, metrics-server is still warming up.

### Port Not Accessible

Make sure you clicked the **"Access Port 8000"** button in Killercoda, not just opening localhost in your browser.

### Python Dependencies Failed

The script automatically installs pip. If it fails:

```bash
apt-get update
apt-get install -y python3-pip
pip3 install -r requirements.txt
```

---

## 💡 Tips

- The app shows **real-time data** - costs update as pod usage changes
- Try scaling deployments to see costs update: `kubectl scale deployment nginx -n production --replicas=5`
- Modify cost rates in `config/cost_model.yaml` to match your pricing
- Export cost data via the API endpoints for integration

---

## 🎓 What This Demonstrates

This deployment showcases:

- ✅ Real Kubernetes integration (not demo mode)
- ✅ Metrics API integration
- ✅ Multi-namespace cost tracking
- ✅ Pod-level granularity
- ✅ Red Hat PatternFly UI
- ✅ FastAPI backend with async support
- ✅ Production-ready architecture

Perfect for demos, presentations, or learning Kubernetes cost management!

---

**Questions?** Open an issue on GitHub: <https://github.com/iamirrf/kubecost/issues>

**Enjoy exploring KubeCost!** 🚀
