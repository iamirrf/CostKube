# Kubernetes Cost Explorer

# 💰 CostKube
Kubernetes Cost Explorer built successfully - Red Hat themed UI, real metrics support, demo fallback, cost model configurable via YAML

## Kubernetes Cost Analytics Platform

## Overview

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
This is a Kubernetes Cost Explorer that estimates per namespace and per pod cost using CPU and memory usage, and a simple cost model. The application connects to a Kubernetes cluster to fetch real metrics, applies a configurable cost model, and displays the results in a Red Hat themed dashboard.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)

## Features

[![Red Hat](https://img.shields.io/badge/Powered%20by-Red%20Hat-EE0000?logo=redhat)](https://www.redhat.com/)

- Real-time Kubernetes metrics fetching (CPU and memory usage)
- Configurable cost model via YAML
- Red Hat themed UI with PatternFly styling
- Namespace and pod-level cost breakdown
- Demo mode when no cluster is available
- Summary cards showing total costs and expensive namespaces

## Prerequisites

- Python 3.11+
- Kubernetes cluster (optional, demo mode available)
- kubectl configured (optional, for real cluster access)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Demo Mode](#-demo-mode)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

**CostKube** is a production-ready Kubernetes cost analytics platform designed for Red Hat SWE engineers and DevOps teams. It provides real-time visibility into Kubernetes resource consumption and associated costs across namespaces and pods.

### Why CostKube?

- 💡 **Real-Time Insights**: Live metrics from Kubernetes clusters with automatic refresh
- 🎨 **Enterprise UI**: Built with Red Hat's design system and PatternFly components
- 📊 **Interactive Visualizations**: Beautiful charts powered by Chart.js
- 🔄 **Demo Mode**: Automatically falls back to demo data when no cluster is available
- ⚙️ **Highly Configurable**: YAML-based cost model configuration
- 🌓 **Dark/Light Theme**: Professional theming with smooth transitions
- 🎯 **Zero Configuration**: Works out of the box with sensible defaults

### With Docker (optional)

1. Build the image:

```bash
docker build -t kube-cost-explorer .
```

2. Run the container:

```bash
docker run -p 8000:8000 kube-cost-explorer
```

---

## ✨ Features

### 📈 Cost Analytics

- **Namespace-level cost breakdown** with hourly and monthly projections
- **Pod-level granularity** for detailed resource attribution
- **Configurable cost model** for CPU and memory pricing
- **Real-time metrics** via Kubernetes Metrics Server API

### 🎨 User Interface

- **Red Hat Sovereign Design System** with PatternFly integration
- **Interactive KPI cards** with tooltips and contextual help
- **Live charts and visualizations** (cost distribution, resource allocation, trends)
- **Responsive design** optimized for desktop and mobile
- **Dark/Light theme** with persistent preference

### 🔧 Technical Features

The cost model is configured in `config/cost_model.yaml`:

```yaml
currency: USD
cpu_per_core_hour: 0.031  # 1 vCPU hour price
mem_per_gb_hour: 0.04    # 1 GiB RAM hour price
```

- **FastAPI backend** with async support
- **Kubernetes Python client** for cluster integration
- **Automatic demo mode** when cluster unavailable
- **Comprehensive test suite** with pytest
- **Type hints** throughout the codebase
- **CORS support** for cross-origin requests

## How It Works

- **Real Mode**: When a Kubernetes cluster is available, the app connects using the Kubernetes Python client and fetches metrics from the metrics.k8s.io API
- **Demo Mode**: When no cluster is available, the app uses sample data from `sample_data/demo_metrics.json`

The application will automatically detect if it can connect to a cluster and switch between modes accordingly. The UI will show a "LIVE" or "DEMO" badge indicating the current mode.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                       KubeCost Platform                      │
├─────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Frontend   │◄───────►│   FastAPI    │                  │
│  │  (Vanilla JS)│         │   Backend    │                  │
│  └──────────────┘         └──────┬───────┘                  │
│        │                          │                           │
│        │                          ▼                           │
│        │                  ┌──────────────┐                   │
│        │                  │ Cost Model   │                   │
│        │                  │   Service    │                   │
│        │                  └──────┬───────┘                   │
│        │                          │                           │
│        ▼                           │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  Chart.js    │         │ K8s Client   │                  │
│  │ Visualizations│         │   Service    │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                           │
│                                   ▼                           │
│                          ┌──────────────┐                    │
│                          │ Kubernetes   │                    │
│                          │ Metrics API  │                    │
│                          └──────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 | Sovereign UI design system |
| **Backend** | FastAPI, Uvicorn | High-performance async API |
| **K8s Client** | kubernetes-python | Cluster metrics collection |
| **Cost Model** | Python, YAML | Configurable pricing engine |
| **Visualization** | Chart.js | Interactive charts |
| **Styling** | PatternFly, Red Hat Design | Enterprise-grade UI |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- Kubernetes cluster (optional - demo mode available)
- `kubectl` configured (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iamirrf/CostKube.git
   cd CostKube
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**

   ```bash
   uvicorn app.main:app --reload --host 0.0.0 --port 800
   ```

5. **Open in browser**

   Navigate to `http://localhost:8000`

---

## 🌐 Live Demos

### 🚀 Instant Access (Recommended)

**Live Application**: [https://costkube.onrender.com](https://costkube.onrender.com)
- ✅ Full FastAPI backend with real Kubernetes support
- ✅ Automatic demo mode with sample data
- ⚠️ First visit may take 30-60 seconds (free tier wakes from sleep)
- ✅ Persistent URL - bookmark it!

**Static Demo**: [https://iamirrf.github.io/CostKube/](https://iamirrf.github.io/CostKube/)
- ✅ Instant load, no wait time
- ✅ Beautiful UI showcase
- ✅ Demo mode with sample data

---

## ☁️ Free Kubernetes Cluster Deployment

Want to try CostKube with a real Kubernetes cluster without any costs? Use our **automated deployment to Killercoda** (free Kubernetes playground)!

### Auto-Restart Deployment (Recommended)

**Set it and forget it!** Automatically redeploys when sessions expire.

1. **Go to Killercoda Playground**

   Visit: <https://killercoda.com/playgrounds/scenario/kubernetes>

   Click "Start" (no login required)

2. **Run the auto-restart script**

   ```bash
   curl -sSL https://raw.githubusercontent.com/iamirrf/CostKube/main/auto_deploy_killercoda.sh | bash
   ```

3. **Access the app**

   Click the "Access Port 800" button in Killercoda's UI!

**That's it!** The script will:

- ✅ Auto-deploy and start CostKube
- ✅ Monitor session expiration
- ✅ Auto-redeploy every hour
- ✅ Keep running indefinitely

### 🚀 Manual Deployment (Single Session)

For manual control (session expires after 1 hour):

1. **Go to Killercoda Playground**

   Visit: <https://killercoda.com/playgrounds/scenario/kubernetes>

   Click "Start" (no login required)

2. **Run the deployment script**

   ```bash
   curl -sSL https://raw.githubusercontent.com/iamirrf/CostKube/main/deploy_killercoda.sh | bash
   ```

3. **Start CostKube**

   ```bash
   cd CostKube
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

4. **Access the app**

   Click the "Access Port 800" button in Killercoda's UI!

### ✨ What the Script Does

The automated deployment script:

- ✅ Installs and configures metrics-server
- ✅ Creates sample namespaces (production, development, staging)
- ✅ Deploys sample workloads (nginx, redis, postgres)
- ✅ Clones CostKube and installs dependencies
- ✅ Verifies everything is working

### 🎯 Manual Setup (Alternative)

If you prefer manual setup, see [KUBERNETES_SETUP.md](KUBERNETES_SETUP.md) for detailed instructions.

### ☸️ Deploy to Your Own Cluster

Want to deploy to your own Kubernetes cluster?

```bash
kubectl apply -f k8s-deployment.yaml
```

This creates:

- Namespace: `costkube`
- ServiceAccount with proper RBAC permissions
- Deployment with resource limits
- NodePort Service on port 30800

Access at: `http://<node-ip>:3080`

---

## 🎮 Demo Mode

No Kubernetes cluster? No problem! CostKube automatically falls back to demo mode.

The app will:

- ✅ Use realistic sample data
- ✅ Display all features and visualizations
- ✅ Show a "DEMO MODE" indicator
- ✅ Work without any cluster connection

Simply start the app and it will auto-detect whether to use live or demo data.

---

```
http://localhost:8000
```

### Docker Installation (Alternative)

```bash
# Build the image
docker build -t costkube:latest .

# Run the container
docker run -p 8000:8000 costkube:latest
```

---

## ⚙️ Configuration

CostKube uses a YAML-based configuration file located at `config/cost_model.yaml`:

```yaml
# Cost Model Configuration
currency: USD

# Pricing per hour
cpu_per_core_hour: 0.031  # Cost per vCPU core per hour
mem_per_gb_hour: 0.004    # Cost per GiB memory per hour

# Example pricing based on AWS EC2 pricing
# Adjust these values based on your cloud provider or on-prem costs
```

### Customizing Costs

1. Edit `config/cost_model.yaml`
2. Adjust `cpu_per_core_hour` and `mem_per_gb_hour` based on your infrastructure
3. Restart the application

**Pricing Reference:**

- **AWS**: Use EC2 instance pricing divided by cores/memory
- **GCP**: Use Compute Engine pricing
- **Azure**: Use Virtual Machine pricing
- **On-Premises**: Calculate based on hardware depreciation and power costs

---

## 🎭 Demo Mode

CostKube automatically detects when a Kubernetes cluster is unavailable and switches to **demo mode**:

- ✅ Uses sample data from `sample_data/demo_metrics.json`
- ✅ Shows all UI features and functionality
- ✅ Perfect for development and presentations
- ✅ Displays a "Demo Mode Active" banner

**To test demo mode:**

```bash
# Simply run the app without a connected cluster
uvicorn app.main:app --reload
```

---

## 🛠️ Development

### Project Structure

```
CostKube/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py           # API endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── cost_model.py       # Cost calculation logic
│   │   ├── demo_data.py        # Demo data provider
│   │   └── k8s_client.py       # Kubernetes client wrapper
│   └── ui/
│       ├── static/
│       │   ├── css/
│       │   │   └── styles.css # Sovereign UI styles
│       │   └── js/
│       │       └── app.js      # Frontend JavaScript
│       └── templates/
│           └── index.html      # Main HTML template
├── config/
│   └── cost_model.yaml         # Cost configuration
├── sample_data/
│   └── demo_metrics.json       # Demo mode data
├── tests/
│   ├── __init__.py
│   ├── test_api_basic.py       # API tests
│   └── test_cost_model.py      # Cost model tests
├── .gitignore
├── requirements.txt
└── README.md
```

### Development Workflow

1. **Install dev dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run tests**

   ```bash
   pytest -v
   ```

3. **Start dev server with auto-reload**

   ```bash
   uvicorn app.main:app --reload --host 0.0.0 --port 800
   ```

4. **Code formatting** (recommended)

   ```bash
   # Install black and isort
   pip install black isort

   # Format code
   black app/ tests/
   isort app/ tests/
   ```
---

## 🧪 Testing

CostKube includes a comprehensive test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_cost_model.py -v

# Run with detailed output
pytest -vv
```

### Test Coverage

- ✅ API endpoint tests
- ✅ Cost model calculation tests
- ✅ Demo data validation
- ✅ Kubernetes client mocking
- ✅ Integration tests

---

## 🚢 Deployment

### ☁️ Render.com (Recommended - Free & Easy)

**Deploy CostKube to the cloud in 5 minutes with a permanent public URL!**

#### Quick Deploy

1. **Fork/Clone this repository**
2. **Go to [Render.com](https://render.com)** (sign up for free - no credit card needed)
3. **Click "New +" → "Blueprint"**
4. **Connect your GitHub repository**
5. **Render auto-detects `render.yaml` and deploys**
6. **Done! Get URL like `https://costkube.onrender.com`**

#### What You Get

- ✅ **Permanent public URL** - Share with anyone
- ✅ **Automatic HTTPS** - Free SSL certificate
- ✅ **Auto-deployment** - Push to GitHub = auto-deploy
- ✅ **Professional loading screen** - Smooth cold start experience
- ⚠️ **Free tier limitations** - Sleeps after 15 mins (30-60 sec wake time)

#### Full Guide

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for complete instructions, troubleshooting, and configuration options.

---

### Production Deployment

1. **Set environment variables**

   ```bash
   export PYTHONUNBUFFERED=1
   export PORT=8000
   ```

2. **Run with Gunicorn**

   ```bash
   pip install gunicorn
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: costkube
spec:
  replicas: 2
  selector:
    matchLabels:
      app: costkube
  template:
    metadata:
      labels:
        app: costkube
    spec:
      serviceAccountName: costkube-sa
      containers:
      - name: costkube
        image: costkube:latest
        ports:
        - containerPort: 8000
        env:
        - name: PORT
          value: "8000"
---
apiVersion: v1
kind: Service
metadata:
  name: costkube
spec:
  selector:
    app: costkube
  ports:
  - port: 80
    targetPort: 8000
 type: LoadBalancer
```

### 🐳 Docker Deployment

Build and run CostKube with Docker:

```bash
# Build the image
docker build -t costkube:latest .

# Run locally
docker run -p 8000:8000 costkube:latest

# Run with custom config
docker run -p 8000:8000 -v $(pwd)/config:/app/config costkube:latest
```

### 📄 Static Demo (GitHub Pages)

For hosting a static UI demo, see the `docs/` directory. This shows the interface with demo data only (no backend required).

---

## 📚 API Documentation

## Endpoints

### `GET /api/config`

Returns the current cost model configuration.

**Response:**

```json
{
  "currency": "USD",
  "cpu_per_core_hour": 0.031,
  "mem_per_gb_hour": 0.004,
  "demo_mode": false
}
```

### `GET /api/namespaces`

Returns cost breakdown for all namespaces.

**Response:**

```json
{
  "data": [
    {
      "namespace": "default",
      "cpu_mcores": 1500,
      "memory_bytes": 2147483648,
      "hourly_cost": 0.055,
      "monthly_cost": 39.60
    }
 ],
  "demo_mode": false
}
```

### `GET /api/pods?namespace={namespace}`

Returns cost breakdown for pods in a specific namespace.

**Parameters:**

- `namespace` (query): Namespace name

**Response:**

```json
{
  "data": [
    {
      "pod": "nginx-deployment-abc123",
      "namespace": "default",
      "cpu_mcores": 500,
      "memory_bytes": 536870912,
      "hourly_cost": 0.018,
      "monthly_cost": 12.96
    }
  ],
  "demo_mode": false
}
```

## Interactive API Docs

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

---

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings to all functions and classes
- Write tests for new features
- Keep the UI consistent with Red Hat design principles

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Red Hat** for the design system and PatternFly components
- **Kubernetes** community for excellent tooling and documentation
- **FastAPI** for the modern Python web framework
- **Chart.js** for beautiful visualizations

---

## 📞 Support

- 🌐 **Live App**: [https://costkube.onrender.com](https://costkube.onrender.com)
- 🎨 **UI Demo**: [https://iamirrf.github.io/CostKube/](https://iamirrf.github.io/CostKube/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/iamirrf/CostKube/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/iamirrf/CostKube/discussions)
- 📖 **Documentation**: Full API docs available at `/docs` endpoint

---

## Made with ❤️ for the Kubernetes community

[⬆ Back to Top](#-costkube)
