# 🎮 Simulated Kubernetes Cluster

## Overview

CostKube includes a **simulated Kubernetes cluster** that generates realistic, time-varying metrics without requiring an actual Kubernetes cluster. This is perfect for:

- ✅ **Demo deployments** on Render.com, Heroku, etc.
- ✅ **Development and testing** without cluster setup
- ✅ **Showcasing the platform** with realistic data
- ✅ **Zero cost** - no cloud Kubernetes cluster needed

## Features

### 🔄 **Realistic Time-Varying Metrics**

The simulated cluster generates metrics that change over time, simulating realistic workload patterns:

- **Sinusoidal patterns** that simulate daily usage cycles
- **Random jitter** (±15-20%) for natural fluctuations
- **Peak and off-peak hours** with 0.7x to 1.3x load multiplier

### 🏗️ **Realistic Workloads**

Pre-configured namespaces with typical enterprise workloads:

#### Production Namespace
- `nginx-web` (3 replicas) - Web servers
- `api-gateway` (2 replicas) - API gateway
- `redis-cache` (2 replicas) - Caching layer
- `postgres-db` (1 replica) - Database
- `monitoring` (1 replica) - Monitoring stack

#### Development Namespace
- `webapp-dev` (2 replicas) - Development web app
- `api-dev` (2 replicas) - Development API
- `database-dev` (1 replica) - Dev database

#### Staging Namespace
- `test-app` (1 replica) - Test application
- `integration-tests` (1 replica) - Integration tests

#### Monitoring Namespace
- `prometheus` (1 replica) - Metrics collection
- `grafana` (1 replica) - Visualization

## Usage

### Enable Simulated Mode

Set the environment variable:

```bash
export USE_SIMULATED_CLUSTER=true
```

Or add to your deployment configuration (e.g., `render.yaml`):

```yaml
envVars:
  - key: USE_SIMULATED_CLUSTER
    value: true
```

### Local Testing

```bash
# Start with simulated cluster
USE_SIMULATED_CLUSTER=true uvicorn app.main:app --reload

# Visit http://localhost:8000
```

### Render.com Deployment

The simulated cluster is **already configured** in `render.yaml`. Just deploy and it works!

```bash
# Push to GitHub
git push origin main

# Render.com auto-deploys with simulated cluster enabled
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│    SimulatedKubernetesCluster           │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Time-Based Variance Engine    │    │
│  │  • Sinusoidal patterns         │    │
│  │  • Random jitter               │    │
│  │  • Peak/off-peak simulation    │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Workload Definitions          │    │
│  │  • production (9 pods)         │    │
│  │  • development (5 pods)        │    │
│  │  • staging (2 pods)            │    │
│  │  • monitoring (2 pods)         │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Metrics Generator             │    │
│  │  • CPU (millicores)            │    │
│  │  • Memory (bytes)              │    │
│  │  • Per namespace/pod           │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         KubernetesClient                │
│  • Falls back to simulated cluster      │
│  • Transparent to API layer             │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         CostKube API                    │
│  • Computes costs from metrics          │
│  • Returns demo_mode: false             │
│  • Shows as "LIVE" in UI                │
└─────────────────────────────────────────┘
```

### Time-Varying Algorithm

```python
# Sinusoidal pattern (60-second cycle)
cycle = (time.time() % 60) / 60  # 0 to 1
load_multiplier = 0.7 + 0.6 * abs(2 * cycle - 1)  # 0.7 to 1.3

# Random jitter (±15-20%)
jitter = random.uniform(0.80, 1.20)

# Final metric value
metric_value = base_value * load_multiplier * jitter
```

## API Response

### Config Endpoint

```json
{
  "cost_config": {
    "currency": "USD",
    "cpu_per_core_hour": 0.031,
    "mem_per_gb_hour": 0.004
  },
  "demo_mode": false,
  "k8s_available": true,
  "mode": "simulated"
}
```

### Namespaces Endpoint

```json
{
  "data": [
    {
      "namespace": "production",
      "cpu_mcores": 1164,
      "memory_bytes": 8256099557,
      "cpu_core_hours": 1.164,
      "memory_gb_hours": 7.689,
      "hourly_cost": 0.0668,
      "monthly_cost": 48.79
    },
    ...
  ],
  "demo_mode": false
}
```

**Note**: Metrics change every request to simulate live data!

## Customization

### Add Custom Workloads

Edit `app/services/simulated_k8s.py`:

```python
self.workloads = {
    "production": [
        {"name": "my-app", "replicas": 3, "cpu_base": 200, "mem_base": 512},
        # Add more workloads...
    ],
}
```

### Adjust Variance

```python
# In SimulatedKubernetesCluster._get_time_variance()
load_multiplier = 0.5 + 0.8 * abs(2 * cycle - 1)  # Wider range
```

### Change Cycle Duration

```python
# 5-minute cycle instead of 60 seconds
cycle = (elapsed % 300) / 300
```

## Comparison: Simulated vs Real vs Demo

| Feature | Simulated Cluster | Real Cluster | Demo Mode |
|---------|-------------------|--------------|-----------|
| **Cost** | Free | $12-50/month | Free |
| **Setup** | Zero | Cloud account + cluster | Zero |
| **Data Realism** | High (time-varying) | Highest (actual) | Low (static) |
| **UI Badge** | "LIVE" | "LIVE" | "DEMO" |
| **API `demo_mode`** | `false` | `false` | `true` |
| **Metrics Change** | Every request | Every request | Never |
| **Deployment** | Works anywhere | Needs cluster access | Works anywhere |
| **Use Case** | Demos, development | Production | Testing UI |

## Troubleshooting

### Simulated Mode Not Working

Check environment variable:
```bash
echo $USE_SIMULATED_CLUSTER
# Should output: true
```

### Want Real Cluster Instead

Set to `false`:
```bash
export USE_SIMULATED_CLUSTER=false
```

### Check Current Mode

```bash
curl http://localhost:8000/api/config | jq '.mode'
# Output: "simulated" or "real"
```

## Benefits for Render.com

✅ **No external dependencies** - works immediately  
✅ **No secrets/credentials** needed  
✅ **Instant deployment** - no cluster setup wait  
✅ **Professional appearance** - shows "LIVE" not "DEMO"  
✅ **Zero cost** - free tier works perfectly  
✅ **Realistic demo** - time-varying data impresses users  

## Future Enhancements

Potential improvements:

- [ ] Add spike/anomaly simulation
- [ ] Simulate node failures
- [ ] Cost optimization recommendations
- [ ] Multi-cluster simulation
- [ ] Historical data generation
- [ ] Custom workload templates via config file

---

Made with ❤️ for realistic Kubernetes cost demos
