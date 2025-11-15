# 🚀 Quick Start Guide - CostKube v2.0

## Installation

### 1. Install Dependencies
```bash
cd /Users/amir/Downloads/Job_Projects/Red\ Hat/KubernetesCostAnalysis

# Install new Python packages
pip install -r requirements.txt
```

**New Dependencies Added:**
- `aiosqlite` - Async SQLite database
- `websockets` - WebSocket support
- `python-multipart` - File upload support
- `numpy` - Numerical operations for forecasting
- `scikit-learn` - Machine learning for predictions

---

## Running the Application

### Start the Server
```bash
cd kube-cost-explorer
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Access the Dashboard
Open your browser to: **http://localhost:8000**

---

## Testing New Features

### 1. ✅ Historical Data Tracking

**Automatic:** Historical data is automatically saved every time you fetch namespace or pod data.

**Test APIs:**
```bash
# Get cost trends (last 7 days)
curl http://localhost:8000/api/history/trends?hours=168 | python3 -m json.tool

# Get namespace history
curl http://localhost:8000/api/history/namespaces?hours=24 | python3 -m json.tool

# Get top 10 most expensive namespaces
curl http://localhost:8000/api/history/top-namespaces?limit=10 | python3 -m json.tool
```

**In UI:**
- Historical data powers the trend chart
- After a few hours of running, you'll see real trends instead of demo data

---

### 2. ✅ Export & Reporting

**Test in UI:**
1. Click the **"Export CSV"** button → Downloads `costkube_namespaces_YYYYMMDD_HHMMSS.csv`
2. Click the **"Export JSON"** button → Downloads `costkube_namespaces_YYYYMMDD_HHMMSS.json`

**Test APIs:**
```bash
# Export as CSV
curl http://localhost:8000/api/export/namespaces/csv > export.csv

# Export as JSON
curl http://localhost:8000/api/export/namespaces/json > export.json
```

**Verify:**
```bash
# Check CSV
cat export.csv

# Check JSON
cat export.json | python3 -m json.tool
```

---

### 3. ✅ Resource Right-Sizing Recommendations

**Test in UI:**
1. Click the **"Recommendations"** button in the toolbar
2. View the recommendations panel with:
   - Potential monthly savings
   - High/medium priority issues
   - Idle resource detection
   - Specific optimization suggestions

**Test APIs:**
```bash
# Get all recommendations
curl http://localhost:8000/api/recommendations | python3 -m json.tool

# Get only idle resources
curl http://localhost:8000/api/recommendations/idle | python3 -m json.tool
```

**Example Output:**
```json
{
  "total_namespaces_analyzed": 5,
  "namespaces_with_recommendations": 3,
  "total_potential_monthly_savings": 127.45,
  "high_priority_count": 2,
  "idle_resource_count": 1,
  "right_sizing_recommendations": [...]
}
```

---

### 4. ✅ WebSocket Real-Time Updates

**Test in Browser Console:**
```javascript
// Open browser console (F12) and run:
const ws = new WebSocket('ws://localhost:8000/ws/metrics');
ws.onopen = () => {
  console.log('✅ WebSocket connected');
  ws.send('ping'); // Request update
};
ws.onmessage = (event) => {
  console.log('📊 Received:', JSON.parse(event.data));
};
```

**In UI:**
- WebSocket automatically connects on page load
- Metrics update every 30 seconds without manual refresh
- Connection status shown in header (LIVE badge)

**Check Connection:**
- Look for "✅ WebSocket connected" in browser console
- Watch the network tab for WebSocket frames

---

### 5. ✅ Advanced Filtering & Search

**Test in UI:**
1. **Search**: Type namespace name in search box (e.g., "prod", "dev")
   - Results filter in real-time
   - Case-insensitive search

2. **Sort**: Use the dropdown to sort by:
   - Monthly Cost (default)
   - Namespace
   - CPU usage
   - Memory usage

3. **Sort Direction**: Click the "▼ Descending" / "▲ Ascending" button
   - Toggle between ascending and descending
   - Works with any sort column

**Advanced Search Examples:**
- Search for `prod` → Shows all production namespaces
- Sort by `CPU` → See which namespaces use most CPU
- Sort by `Memory` + Ascending → Find lowest memory users

---

### 6. ✅ Cost Forecasting & Prediction

**Note:** Requires at least 7 days of historical data for accurate forecasts.

**Test APIs:**
```bash
# Get 30-day forecast (after collecting data)
curl http://localhost:8000/api/forecast?days=30 | python3 -m json.tool

# Predict budget runway
curl "http://localhost:8000/api/forecast/budget-runway?budget=1000" | python3 -m json.tool
```

**In UI:**
- Forecast card appears automatically after 7 days of data
- Shows:
  - Predicted monthly cost
  - Trend direction (📈📉➡️)
  - Percentage change
  - Confidence level

**Quick Test (Simulated Data):**
After app runs for a few hours, the database will have enough data points. The forecast will use linear regression to predict future costs.

---

### 7. ✅ Idle Resource Detection

**Test API:**
```bash
curl http://localhost:8000/api/recommendations/idle | python3 -m json.tool
```

**In UI:**
- Idle resources appear in the Recommendations panel
- Marked with 🚨 HIGH severity
- Shows potential savings (95% of current cost)

**Idle Criteria:**
- CPU: < 50 millicores
- Memory: < 50 MB

**Example Output:**
```json
{
  "idle_resources": [
    {
      "namespace": "test-namespace",
      "type": "IDLE_RESOURCE",
      "severity": "high",
      "monthly_cost": 42.50,
      "potential_savings": 40.38,
      "message": "Namespace appears idle... Consider removing..."
    }
  ]
}
```

---

### 8. ✅ Mobile Responsiveness

**Test on Different Devices:**

1. **Desktop** (>1200px):
   - Full 3-column layout
   - All charts visible
   - Full table width

2. **Tablet** (768px-1200px):
   - 2-column layout
   - Stacked charts
   - Responsive table

3. **Mobile** (<768px):
   - Single column
   - Optimized chart heights (250px)
   - Full-width search bar
   - Horizontal table scroll

**Chrome DevTools Testing:**
1. Open DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Test different devices:
   - iPhone 12 Pro
   - iPad
   - Samsung Galaxy S20
   - Desktop

**Touch Testing:**
- Charts respond to touch gestures
- Buttons have larger touch targets
- Smooth scrolling
- No horizontal scroll (except tables)

---

### 9. ✅ Significantly Improved UI

**Visual Improvements:**

1. **Loading States:**
   - Beautiful loading page on startup
   - Skeleton loaders for data
   - Smooth progress animations

2. **Animations:**
   - Cards fade in on load
   - Smooth transitions
   - Hover effects
   - Scale animations on KPIs

3. **New Components:**
   - Forecast cards with gradients
   - Recommendation panel
   - Search & filter bar
   - Export buttons
   - Severity badges

4. **Dark/Light Themes:**
   - Click the sun/moon icon in header
   - Smooth theme transitions
   - Consistent color schemes
   - Charts update with theme

**Test Theme Switching:**
```javascript
// In browser console:
// Toggle theme
document.documentElement.setAttribute('data-theme', 'light');
document.documentElement.setAttribute('data-theme', 'dark');
```

---

## Database Management

### Database Location
```bash
# Database file is created automatically
ls -lh data/costkube.db
```

### Check Database Contents
```bash
# Install sqlite3 if needed
# brew install sqlite3  # macOS
# apt-get install sqlite3  # Linux

# View tables
sqlite3 data/costkube.db ".tables"

# View namespace metrics
sqlite3 data/costkube.db "SELECT * FROM namespace_metrics LIMIT 10;"

# Count records
sqlite3 data/costkube.db "SELECT COUNT(*) FROM namespace_metrics;"
```

### Clear Database (if needed)
```bash
rm -f data/costkube.db
# Will be recreated on next startup
```

---

## Troubleshooting

### Issue: WebSocket not connecting
**Solution:**
```bash
# Check if port 8000 is open
lsof -i :8000

# Restart the server
pkill -f "uvicorn app.main:app"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: Database errors
**Solution:**
```bash
# Database will auto-initialize
# If issues persist, delete and restart:
rm -f data/costkube.db
# Restart server
```

### Issue: Forecast shows error
**Reason:** Not enough historical data (need 7+ days)

**Solution:** Wait for data collection or manually insert test data:
```python
# Python script to insert test data
import aiosqlite
import asyncio
from datetime import datetime, timedelta

async def insert_test_data():
    async with aiosqlite.connect('data/costkube.db') as db:
        for i in range(10):
            timestamp = datetime.now() - timedelta(days=i)
            await db.execute("""
                INSERT INTO namespace_metrics
                (timestamp, namespace, cpu_mcores, memory_bytes, hourly_cost, monthly_cost)
                VALUES (?, 'test', 500, 1073741824, 0.02, 14.6)
            """, (timestamp,))
        await db.commit()

asyncio.run(insert_test_data())
```

### Issue: Recommendations not showing
**Reason:** No namespace data available yet

**Solution:**
1. Ensure Kubernetes cluster is running
2. Check `/api/namespaces` returns data
3. Click "Refresh" button
4. Check browser console for errors

---

## Performance Tips

### 1. Database Performance
```bash
# Vacuum database periodically
sqlite3 data/costkube.db "VACUUM;"

# Check database size
du -h data/costkube.db
```

### 2. WebSocket Performance
- Adjust heartbeat interval in `app.js` if needed
- Default: 30 seconds
- Increase for slower networks
- Decrease for more frequent updates

### 3. Chart Performance
- Charts render lazily
- Only visible charts are updated
- Destroy old charts before creating new ones

---

## API Testing with curl

### Complete Test Suite
```bash
# 1. Check health
curl http://localhost:8000/api/health | python3 -m json.tool

# 2. Get config
curl http://localhost:8000/api/config | python3 -m json.tool

# 3. Get current namespaces
curl http://localhost:8000/api/namespaces | python3 -m json.tool

# 4. Get pods in namespace
curl "http://localhost:8000/api/pods?namespace=default" | python3 -m json.tool

# 5. Get recommendations
curl http://localhost:8000/api/recommendations | python3 -m json.tool

# 6. Get historical trends
curl http://localhost:8000/api/history/trends?hours=168 | python3 -m json.tool

# 7. Get forecast
curl http://localhost:8000/api/forecast?days=30 | python3 -m json.tool

# 8. Export CSV
curl http://localhost:8000/api/export/namespaces/csv > test.csv

# 9. Export JSON
curl http://localhost:8000/api/export/namespaces/json > test.json
```

---

## Next Steps

### After Testing
1. ✅ Deploy to production (see DEPLOYMENT_SUMMARY.md)
2. ✅ Configure cost model in `config/cost_model.yaml`
3. ✅ Set up monitoring for database size
4. ✅ Schedule periodic database cleanup
5. ✅ Share dashboard URL with team

### Optional Enhancements
- Add authentication
- Set up budget alerts
- Create scheduled reports
- Integrate with Slack/email
- Add Prometheus metrics export

---

## Support

- **Documentation**: See UPGRADE_V2_SUMMARY.md for detailed feature guide
- **API Docs**: http://localhost:8000/docs
- **Issues**: https://github.com/iamirrf/CostKube/issues

---

**Happy Cost Optimizing! 🚀💰**

*CostKube v2.0 - The Complete Cost Management Platform*
