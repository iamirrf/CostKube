# 🚀 CostKube - Quick Start Guide

## 🌐 Easiest Way: Just Visit the URL!

**Live Application**: https://costkube.onrender.com

- ✅ **No installation required** - Just click and use!
- ✅ Full FastAPI backend with demo mode
- ⚠️ First visit may take 30-60 seconds (free tier wakes from sleep)
- ✅ Beautiful loading screen shows progress

**Static UI Demo**: https://iamirrf.github.io/costkube/

- ✅ Instant load, no waiting
- ✅ Perfect for previewing the interface

---

## ☁️ Option 1: Free Cloud Deployment (Permanent URL)

### Deploy to Render.com (5 Minutes)

Get your own persistent deployment:

1. **Fork the repository** on GitHub
2. **Sign up** at [Render.com](https://render.com) (free, no credit card)
3. **Click** "New +" → "Blueprint"
4. **Select** your forked repository
5. **Deploy** - Render auto-detects configuration
6. **Done!** You get `https://your-app.onrender.com`

📖 **Full Guide**: See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

---

## 🎮 Option 2: Killercoda (Real Kubernetes Cluster)

### Deploy to Killercoda (100% Free, No Login)

**⏱️ Takes 2 minutes total!**

1. **Open Killercoda Playground**

   ```
   🌐 https://killercoda.com/playgrounds/scenario/kubernetes
   ```

   Click "Start" → Wait 30 seconds

2. **Run One Command**

   ```bash
   curl -sSL https://raw.githubusercontent.com/iamirrf/costkube/main/deploy_killercoda.sh | bash
   ```

3. **Start CostKube**

   ```bash
   cd costkube
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

4. **Access the App**
   - Click "Access Port 8000" in Killercoda UI
   - Or use the provided URL

**✨ Features:**

- ✅ Real Kubernetes cluster (not demo!)
- ✅ Metrics-server pre-configured
- ✅ Sample workloads deployed
- ✅ No credit card required
- ✅ No account needed
- ⏰ 1-hour sessions (can restart anytime)

---

## 💻 Option 3: Local Development

### Connect to Your Local Cluster

```bash
## Installation

```bash
git clone https://github.com/iamirrf/CostKube.git
cd CostKube/kube-cost-explorer

# Install dependencies
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Make sure your cluster is running
kubectl cluster-info

# Start the app
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Open browser
open http://localhost:8000
```

---

## ☸️ Option 4: Deploy to Kubernetes Cluster

```bash
# Deploy CostKube into your cluster
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods -n costkube

# Access the app
kubectl get svc -n costkube
# App runs on NodePort 30800
```

Access at: `http://<any-node-ip>:30800`

---

## 📊 What You'll See

Once deployed, you'll get:

✅ **Real-time metrics** from your Kubernetes cluster
✅ **Namespace-level costs** (production, development, staging)
✅ **Pod-level breakdown** with CPU/memory usage
✅ **Interactive charts** showing cost distribution
✅ **Cost trends** over time
✅ **Red Hat themed UI** with PatternFly design

---

## 🔧 Troubleshooting

### "No metrics available"

```bash
# Wait 1-2 minutes after deployment
# Metrics server needs time to collect data

# Check metrics-server
kubectl get pods -n kube-system | grep metrics
kubectl top nodes  # Should show node metrics
```

### "Can't connect to cluster"

```bash
# Verify kubectl works
kubectl get nodes

# Check kubeconfig
kubectl config view
```

### "App won't start"

```bash
# Check Python version
python3 --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

---

## 📖 Full Documentation

- **Render.com Deployment:** See `RENDER_DEPLOYMENT.md`
- **Setup Guide:** See `KUBERNETES_SETUP.md`
- **API Docs:** Visit `http://localhost:8000/docs` (when app is running)
## 🔗 Links

- **GitHub Repo:** https://github.com/iamirrf/CostKube
- **Live Application:** https://costkube.onrender.com
- **Static Demo:** https://iamirrf.github.io/CostKube/

---

## 🎯 Quick Test Commands

```bash
# Check if app is running
curl http://localhost:8000/api/config

# Get namespace costs
curl http://localhost:8000/api/namespaces | python3 -m json.tool

# Get pod costs
curl http://localhost:8000/api/pods | python3 -m json.tool

# Get pod costs for specific namespace
curl http://localhost:8000/api/pods?namespace=production | python3 -m json.tool
```

---

## ⚡ Pro Tips

1. **Best Experience:** Use Killercoda for instant deployment with zero setup
2. **Development:** Use local cluster for testing changes
3. **Production:** Deploy to your own K8s cluster with the manifest
4. **Customization:** Edit `config/cost_model.yaml` to adjust pricing

---

**Happy Cost Exploring! 🚀**
