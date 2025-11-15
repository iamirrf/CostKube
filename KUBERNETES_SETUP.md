# KubeCost - Free Kubernetes Cluster Setup

## Using Killercoda Free Kubernetes Playground

### Step 1: Start Your Free Cluster

1. Visit: https://killercoda.com/playgrounds/scenario/kubernetes
2. Click "Start" (no login required)
3. Wait ~30 seconds for cluster initialization

### Step 2: Deploy Metrics Server (If Not Already Running)

In the Killercoda terminal:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Patch for insecure TLS (playground environments need this)
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Wait for metrics-server to be ready
kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=60s
```

### Step 3: Create Sample Workloads

```bash
# Create some namespaces and deployments for testing
kubectl create namespace production
kubectl create namespace development
kubectl create namespace staging

# Deploy sample apps
kubectl create deployment nginx --image=nginx --replicas=3 -n production
kubectl create deployment redis --image=redis --replicas=2 -n production
kubectl create deployment postgres --image=postgres --replicas=1 -n production

kubectl create deployment webapp --image=nginx --replicas=2 -n development
kubectl create deployment api --image=nginx --replicas=2 -n development

kubectl create deployment test-app --image=nginx --replicas=1 -n staging

# Wait for pods to be ready
sleep 30

# Verify metrics are available
kubectl top nodes
kubectl top pods --all-namespaces
```

### Step 4: Get Kubeconfig for Local Connection

In Killercoda terminal:
```bash
cat ~/.kube/config
```

Copy the output and save it to your local machine:
```bash
# On your Mac
mkdir -p ~/.kube/killercoda
# Paste the config into a file
nano ~/.kube/killercoda/config
# Or use the provided script below
```

### Step 5: Deploy KubeCost to the Cluster

In Killercoda terminal:
```bash
# Install Python and dependencies
apt-get update && apt-get install -y python3-pip git
git clone https://github.com/iamirrf/kubecost.git
cd kubecost

# Install dependencies
pip3 install -r requirements.txt

# Run the app (accessible via Killercoda's port forwarding)
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Killercoda will provide a URL to access your app!

### Alternative: Run Locally with Remote Cluster

```bash
# Use the kubeconfig from Killercoda
export KUBECONFIG=~/.kube/killercoda/config

# Verify connection
kubectl get nodes

# Run app locally
cd /path/to/kubecost
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Session Duration

- **Killercoda**: 1 hour sessions (can restart)
- **Alternative**: Use Okteto Cloud for longer sessions (https://www.okteto.com/)

---

## Troubleshooting

### Metrics Server Not Ready
```bash
kubectl get pods -n kube-system | grep metrics
kubectl logs -n kube-system -l k8s-app=metrics-server
```

### Connection Issues
```bash
# Test cluster connectivity
kubectl cluster-info
kubectl get nodes
kubectl get pods --all-namespaces
```

### App Can't Connect
```bash
# Verify KUBECONFIG
echo $KUBECONFIG
kubectl config view

# Check if metrics API is accessible
kubectl top nodes
```

