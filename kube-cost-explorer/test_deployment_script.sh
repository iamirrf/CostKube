#!/bin/bash

# Test script to verify auto_deploy_killercoda.sh changes locally
# This simulates what happens in Killercoda

set -e

echo "🧪 Testing deployment script changes locally..."
echo ""

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Test directory: $TEMP_DIR"
cd "$TEMP_DIR"

echo ""
echo "1️⃣  Cloning repository..."
git clone https://github.com/iamirrf/kubecost.git

echo ""
echo "2️⃣  Checking directory structure..."
if [ -d "kubecost/kube-cost-explorer" ]; then
    echo "✅ kube-cost-explorer subdirectory exists"
else
    echo "❌ kube-cost-explorer subdirectory NOT found"
    exit 1
fi

echo ""
echo "3️⃣  Navigating to application directory..."
cd kubecost/kube-cost-explorer

echo ""
echo "4️⃣  Checking for required files..."
if [ -f "requirements.txt" ]; then
    echo "✅ requirements.txt found"
else
    echo "❌ requirements.txt NOT found"
    exit 1
fi

if [ -f "app/main.py" ]; then
    echo "✅ app/main.py found"
else
    echo "❌ app/main.py NOT found"
    exit 1
fi

echo ""
echo "5️⃣  Installing dependencies (this may take a moment)..."
pip3 install -r requirements.txt > /dev/null 2>&1

echo ""
echo "6️⃣  Starting application (background)..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 > test_app.log 2>&1 &
APP_PID=$!

sleep 5

echo ""
echo "7️⃣  Testing health endpoint..."
if curl -s http://localhost:8001/api/health > /dev/null; then
    echo "✅ Health endpoint responding"
    echo ""
    echo "Health status:"
    curl -s http://localhost:8001/api/health | python3 -m json.tool
else
    echo "❌ Health endpoint NOT responding"
    echo ""
    echo "Application log:"
    cat test_app.log
    kill $APP_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "8️⃣  Testing config endpoint..."
if curl -s http://localhost:8001/api/config > /dev/null; then
    echo "✅ Config endpoint responding"
else
    echo "❌ Config endpoint NOT responding"
fi

echo ""
echo "9️⃣  Cleaning up..."
kill $APP_PID 2>/dev/null || true
cd /
rm -rf "$TEMP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ All tests passed! Deployment script should work correctly."
echo "═══════════════════════════════════════════════════════════"
