# 🚀 Deploying CostKube to Render.com

This guide will walk you through deploying CostKube to Render.com's free tier, giving you a persistent, publicly accessible URL for your Kubernetes cost analytics platform.

## Why Render.com?

- ✅ **100% Free** - No credit card required
- ✅ **Persistent URL** - Your app gets a permanent URL like `https://costkube.onrender.com`
- ✅ **Auto-deploys** - Push to GitHub, and Render automatically deploys
- ✅ **HTTPS by default** - Free SSL certificates
- ⚠️ **Cold starts** - Free tier spins down after 15 minutes of inactivity (~30-60 sec wake time)

## Prerequisites

1. GitHub account with your CostKube repository
2. Render.com account (free) - Sign up at https://render.com

## Deployment Steps

### Method 1: Using render.yaml (Recommended)

This method uses the included `render.yaml` configuration file for automated deployment.

#### Step 1: Push to GitHub

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Deploy CostKube to Render"
git push origin main
```

#### Step 2: Connect to Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account if not already connected
4. Select your `costkube` repository
5. Render will automatically detect the `render.yaml` file
6. Click **"Apply"**

#### Step 3: Wait for Deployment

- Render will build and deploy your app (takes ~2-5 minutes)
- Once complete, you'll get a URL like: `https://costkube.onrender.com`

#### Step 4: Test Your Deployment

Visit your URL. The first load might take 30-60 seconds if the service is sleeping.

---

### Method 2: Manual Setup

If you prefer manual configuration:

#### Step 1: Create New Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository

#### Step 2: Configure Service

Fill in the following settings:

| Field | Value |
|-------|-------|
| **Name** | `costkube` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `cd kube-cost-explorer && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

#### Step 3: Add Environment Variables (Optional)

Click **"Advanced"** and add:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.8` |
| `PORT` | `8000` |

#### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (~2-5 minutes)
3. Your app will be live at `https://your-service-name.onrender.com`

---

## Configuration Details

### What Gets Deployed

The `render.yaml` file configures:

```yaml
services:
  - type: web
    name: costkube
    runtime: python
    plan: free
    rootDir: kube-cost-explorer
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.8
      - key: PORT
        value: 8000
    healthCheckPath: /api/config
    autoDeploy: true
```

### Health Checks

Render automatically monitors your app via the `/api/config` endpoint. If it fails, Render will restart the service.

---

## Post-Deployment

### Update Your README

After deployment, update your repository links:

1. Change GitHub repo references from `iamirrf/kubecost` to `iamirrf/costkube`
2. Update the live demo link to your Render.com URL
3. Update GitHub Pages if you're using it

### Auto-Deploy Setup

With `autoDeploy: true` in `render.yaml`, every push to your main branch will automatically trigger a new deployment.

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Render automatically deploys in 2-5 minutes
```

---

## Understanding Cold Starts

### Why Does It Happen?

Render's free tier:
- Spins down your service after **15 minutes** of inactivity
- Takes **30-60 seconds** to wake up on the first request

### What We've Done to Help

CostKube includes a **beautiful loading page** that appears during cold starts:

- Shows progress bar with status messages
- Explains what's happening
- Red Hat themed design
- Automatic removal once loaded

The loading screen provides a professional user experience even during wake-up time.

---

## Monitoring Your App

### View Logs

1. Go to your Render.com dashboard
2. Click on your `costkube` service
3. Click **"Logs"** tab
4. See real-time logs of your application

### Check Status

The dashboard shows:
- ✅ Service status (Running/Sleeping)
- 📊 Request count
- ⏱️ Response times
- 🔄 Deployment history

---

## Troubleshooting

### Build Fails

**Problem**: Build command errors

**Solution**:
1. Check that `requirements.txt` is in the `kube-cost-explorer` directory
2. Verify Python version compatibility
3. Check Render logs for specific errors

### App Won't Start

**Problem**: Service fails health checks

**Solution**:
1. Ensure `uvicorn` command is correct
2. Check that port `$PORT` is used (Render provides this variable)
3. Verify `/api/config` endpoint is accessible

### Slow Performance

**Problem**: App is slow after wake-up

**Solution**: This is expected behavior for free tier. Consider:
- Keep-alive service (external monitoring to ping your app)
- Upgrade to paid tier ($7/month for always-on)

---

## Upgrading to Paid Tier

If you want to eliminate cold starts:

1. Go to your service settings
2. Click **"Change Instance Type"**
3. Select **"Starter"** ($7/month)
4. Benefits:
   - ✅ Always on (no cold starts)
   - ✅ More CPU and memory
   - ✅ Faster response times

---

## Custom Domain (Optional)

Want to use your own domain?

1. Go to service **"Settings"**
2. Click **"Custom Domains"**
3. Add your domain (e.g., `cost.yourdomain.com`)
4. Update your DNS records as instructed
5. Free SSL certificate automatically provisioned

---

## Summary

Your CostKube deployment on Render.com provides:

✅ Publicly accessible URL
✅ Automatic HTTPS
✅ Auto-deployment from GitHub
✅ Professional loading screen
✅ Health monitoring
✅ Free forever (with cold starts)

**Live URL**: `https://costkube.onrender.com`

---

## Next Steps

1. ⭐ Star the repository on GitHub
2. 📖 Share the live demo URL
3. 🔧 Configure custom cost model in `config/cost_model.yaml`
4. 🎨 Customize the UI theme
5. 📊 Connect to your Kubernetes cluster

---

## Need Help?

- 📚 [Render Documentation](https://render.com/docs)
- 💬 [GitHub Discussions](https://github.com/iamirrf/costkube/discussions)
- 🐛 [Report Issues](https://github.com/iamirrf/costkube/issues)

---

Made with ❤️ for the Kubernetes community
