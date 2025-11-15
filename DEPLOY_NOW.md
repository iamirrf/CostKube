# 🚀 Deploy KubeCost to Free Kubernetes Cluster NOW

## 🔄 AUTO-RESTART MODE (Recommended)

**Set it and forget it!** This mode automatically redeploys when Killercoda sessions expire (every hour).

### Step 1: Open Killercoda

👉 **Click here:** <https://killercoda.com/playgrounds/scenario/kubernetes>

### Step 2: Click "Start"

- No login required
- Wait 30 seconds for cluster to initialize

### Step 3: Run AUTO-RESTART Command

Copy and paste this **ONE command** into the Killercoda terminal:

```bash
curl -sSL https://raw.githubusercontent.com/iamirrf/kubecost/main/auto_deploy_killercoda.sh | bash
```

### Step 4: Access the App

Click the **"Access Port 8000"** button in Killercoda!

**That's it!** The script will:

- ✅ Deploy KubeCost automatically
- ✅ Start the app on port 8000
- ✅ Monitor the session
- ✅ Auto-redeploy when session expires
- ✅ Keep running indefinitely!

---

## ⚡ Manual Deploy (Single Session)

If you prefer manual control (session expires after 1 hour):

### Step 1: Open Killercoda

👉 **Click here:** <https://killercoda.com/playgrounds/scenario/kubernetes>

### Step 2: Click "Start"

- No login required
- Wait 30 seconds for cluster to initialize

### Step 3: Run ONE Command

Copy and paste this into the Killercoda terminal:

```bash
curl -sSL https://raw.githubusercontent.com/iamirrf/kubecost/main/deploy_killercoda.sh | bash
```

### Step 4: Start the App

After the script completes, run:

```bash
cd kubecost
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Step 5: Access the App

Click the **"Access Port 8000"** button in Killercoda!

---

## ✅ What the Script Does

The automated deployment script:

1. ✅ Verifies Kubernetes cluster is running
2. ✅ Installs metrics-server for real-time metrics
3. ✅ Creates sample workloads (production, development, staging namespaces)
4. ✅ Deploys NGINX, Redis, PostgreSQL pods
5. ✅ Clones KubeCost from GitHub
6. ✅ Installs all Python dependencies
7. ✅ Verifies cluster metrics are available

---

## 🎯 What You'll See

### In Killercoda Terminal

```
╔════════════════╗
║   KubeCost - Complete Setup & Deployment ║
║   Free Kubernetes Playground Edition      ║
╚══════════════╝

✅ Kubernetes cluster detected
✅ Metrics server installed
✅ Sample workloads created
✅ KubeCost application ready
✅ Metrics available

🎉 SETUP COMPLETE! 🎉
```

### In the KubeCost Dashboard

- **Real-time namespace costs** (production, development, staging)
- **Pod-level cost breakdown** (NGINX, Redis, PostgreSQL)
- **CPU and Memory usage charts**
- **Interactive cost visualizations**

---

## 🔧 Troubleshooting

### If metrics aren't ready

```bash
# Wait 1-2 minutes, then check:
kubectl top nodes
kubectl top pods --all-namespaces
```

### If app won't start

```bash
# Verify you're in the right directory:
cd kubecost
ls -la  # Should see app/ directory

# Install dependencies manually:
pip3 install -r requirements.txt
```

### Test the API manually

```bash
# Check configuration:
curl http://localhost:8000/api/config | python3 -m json.tool

# Get namespace costs:
curl http://localhost:8000/api/namespaces | python3 -m json.tool

# Get pod costs:
curl http://localhost:8000/api/pods | python3 -m json.tool
```

---

## 📊 Sample Workloads Created

The script creates a realistic multi-environment setup:

### Production Namespace

- `nginx` (3 replicas) - Web server
- `redis` (2 replicas) - Cache
- `postgres` (1 replica) - Database

### Development Namespace

- `webapp` (2 replicas) - Frontend
- `api` (2 replicas) - Backend API

### Staging Namespace

- `test-app` (1 replica) - Test environment

---

## 🌐 Alternative Playgrounds

If Killercoda is busy, try these:

## Play with Kubernetes

👉 <https://labs.play-with-k8s.com/>

- 4-hour sessions
- Requires Docker Hub account (free)

## Okteto

👉 <https://www.okteto.com/>

- Persistent clusters
- GitHub login
- Longer sessions

---

## 💡 Next Steps After Deployment

1. **Explore the Dashboard**
   - Check namespace costs
   - View pod-level metrics
   - Analyze cost trends

2. **Create More Workloads**

```bash
kubectl create deployment myapp --image=nginx --replicas=5 -n production
```

3. **Watch Metrics Update**
   - Metrics refresh every 30 seconds
   - Real-time cost calculations

4. **Export Data**
   - Use the API endpoints to export cost data
   - Integrate with monitoring tools

---

## 📖 Full Documentation

- **GitHub Repo:** <https://github.com/iamirrf/kubecost>
- **Live Demo:** <https://iamirrf.github.io/kubecost/>
- **API Docs:** <http://localhost:8000/docs> (when running)

---

## 🎓 Learn More

This project demonstrates:

- ✅ Kubernetes cost analysis
- ✅ Real-time metrics collection
- ✅ FastAPI backend development
- ✅ Red Hat Sovereign Design System
- ✅ Cloud-native architecture

---

**Built with ❤️ for Red Hat Engineering**
