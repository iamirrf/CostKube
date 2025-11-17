// ========================================
// RED HAT SOVEREIGN UI - COSTKUBE
// Enterprise-grade JavaScript
// ========================================

'use strict';

// ==================== LOADING PAGE FOR COLD STARTS ====================
const LoadingPage = {
  show() {
    const loadingHTML = `
      <div id="cold-start-loader" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Red Hat Display', sans-serif;
      ">
        <div style="text-align: center; max-width: 500px; padding: 2rem;">
          <div style="margin-bottom: 2rem;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#EE0000" stroke-width="2" style="animation: pulse 2s ease-in-out infinite;">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <h1 style="color: #EE0000; font-size: 2.5rem; margin-bottom: 1rem; font-weight: 700;">
            CostKube
          </h1>
          <p style="color: #fff; font-size: 1.1rem; margin-bottom: 2rem;">
            Kubernetes Cost Analytics Platform
          </p>
          <div style="
            height: 4px;
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
            overflow: hidden;
            margin-bottom: 1.5rem;
          ">
            <div id="loading-progress" style="
              height: 100%;
              background: linear-gradient(90deg, #EE0000 0%, #FF4444 100%);
              width: 0%;
              transition: width 0.3s ease;
              animation: shimmer 2s infinite;
            "></div>
          </div>
          <p id="loading-message" style="color: rgba(255,255,255,0.7); font-size: 0.95rem; min-height: 1.5rem;">
            Initializing application...
          </p>
          <p style="color: rgba(255,255,255,0.5); font-size: 0.85rem; margin-top: 1rem;">
            ⚡ Free tier - Waking up from sleep (~30-60 seconds)
          </p>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      </style>
    `;

    document.body.insertAdjacentHTML('afterbegin', loadingHTML);

    // Update progress
    const progress = document.getElementById('loading-progress');
    const message = document.getElementById('loading-message');
    const messages = [
      { percent: 20, text: 'Connecting to backend server...' },
      { percent: 40, text: 'Loading configuration...' },
      { percent: 60, text: 'Fetching Kubernetes metrics...' },
      { percent: 80, text: 'Preparing dashboard...' },
      { percent: 95, text: 'Almost ready...' }
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < messages.length) {
        progress.style.width = messages[currentIndex].percent + '%';
        message.textContent = messages[currentIndex].text;
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);
  },

  hide() {
    const loader = document.getElementById('cold-start-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.5s ease';
      setTimeout(() => loader.remove(), 500);
    }
  }
};

// ==================== STATE MANAGEMENT ====================
const AppState = {
  namespaces: [],
  config: {},
  isDemoMode: false,
  charts: {},
  websocket: null,
  searchQuery: '',
  sortColumn: 'monthly_cost',
  sortDirection: 'desc',
  recommendations: null,
  forecast: null,
};

// ==================== CHART COLORS ====================
const ChartColors = {
  red: '#EE0000',
  redDark: '#CC0000',
  blue: '#0066CC',
  cyan: '#009596',
  green: '#3E8635',
  orange: '#EC7A08',
  gold: '#F0AB00',
  purple: '#8461C9',
  gray: '#6A6E73',

  gradient(color1, color2) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  },

  palette: [
    '#EE0000', '#0066CC', '#009596', '#3E8635',
    '#EC7A08', '#F0AB00', '#8461C9', '#C9190B'
  ]
};

// ==================== UTILITY FUNCTIONS ====================
const Utils = {
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  formatNumber(value, decimals = 2) {
    return Number(value).toFixed(decimals);
  },

  formatBytes(bytes) {
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  },

  formatCores(mcores) {
    return (mcores / 1000).toFixed(2);
  },

  getCostClass(cost) {
    if (cost > 50) return 'cost-high';
    if (cost > 20) return 'cost-medium';
    return 'cost-low';
  },

  animateValue(element, start, end, duration = 1000) {
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;

      if (element.dataset.format === 'currency') {
        element.textContent = Utils.formatCurrency(current);
      } else if (element.dataset.format === 'bytes') {
        element.textContent = Utils.formatBytes(current);
      } else {
        element.textContent = Math.round(current);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
};

// ==================== THEME MANAGEMENT ====================
const ThemeManager = {
  init() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn?.addEventListener('click', () => this.toggle());
  },

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // Update charts if they exist
    if (Object.keys(AppState.charts).length > 0) {
      Object.values(AppState.charts).forEach(chart => {
        if (chart) chart.destroy();
      });
      ChartManager.renderAllCharts();
    }
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  },

  isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }
};

// ==================== EFFICIENCY CALCULATOR ====================
const EfficiencyCalculator = {
  calculateEfficiency(namespaces, recommendations) {
    if (!namespaces || namespaces.length === 0) {
      return {
        overall: 0,
        cpu: 0,
        memory: 0,
        cost: 0,
        insights: ['📊 Analyzing cluster resources...']
      };
    }

    // Calculate CPU efficiency (assuming 70% utilization is optimal)
    const totalCPU = namespaces.reduce((sum, ns) => sum + ns.cpu_mcores, 0);
    const cpuEfficiency = Math.min(100, (totalCPU / 1000) * 25); // Simplified calculation

    // Calculate memory efficiency
    const totalMemory = namespaces.reduce((sum, ns) => sum + ns.memory_bytes, 0);
    const memoryEfficiency = Math.min(100, (totalMemory / (1024 ** 3)) * 8); // Simplified

    // Calculate cost optimization score
    let costOptimization = 85; // Default high score
    if (recommendations) {
      const potentialSavings = recommendations.total_potential_monthly_savings || 0;
      const totalCost = namespaces.reduce((sum, ns) => sum + ns.monthly_cost, 0);
      if (totalCost > 0) {
        const savingsPercent = (potentialSavings / totalCost) * 100;
        costOptimization = Math.max(0, 100 - savingsPercent);
      }
    }

    // Overall efficiency (weighted average)
    const overall = Math.round((cpuEfficiency * 0.35 + memoryEfficiency * 0.35 + costOptimization * 0.30));

    // Generate insights
    const insights = this.generateInsights(overall, cpuEfficiency, memoryEfficiency, costOptimization, recommendations);

    return {
      overall,
      cpu: Math.round(cpuEfficiency),
      memory: Math.round(memoryEfficiency),
      cost: Math.round(costOptimization),
      insights
    };
  },

  generateInsights(overall, cpu, memory, cost, recommendations) {
    const insights = [];

    if (overall >= 85) {
      insights.push('✅ Excellent cluster efficiency! Your resources are well-optimized.');
    } else if (overall >= 70) {
      insights.push('👍 Good efficiency. Minor optimizations available.');
    } else if (overall >= 50) {
      insights.push('⚠️ Moderate efficiency. Consider optimization opportunities.');
    } else {
      insights.push('🚨 Low efficiency detected. Significant optimization needed.');
    }

    if (cpu < 60) {
      insights.push('💻 CPU utilization is low. Consider rightsizing workloads.');
    } else if (cpu > 90) {
      insights.push('⚡ High CPU usage detected. Monitor for performance issues.');
    }

    if (memory < 60) {
      insights.push('🧠 Memory allocation can be optimized to reduce waste.');
    } else if (memory > 90) {
      insights.push('📊 Memory usage is high. Consider scaling resources.');
    }

    if (recommendations) {
      const idleCount = recommendations.idle_resource_count || 0;
      if (idleCount > 0) {
        insights.push(`🔍 ${idleCount} idle resource${idleCount > 1 ? 's' : ''} found. Quick wins available!`);
      }

      const savings = recommendations.total_potential_monthly_savings || 0;
      if (savings > 10) {
        insights.push(`💰 Potential savings: ${Utils.formatCurrency(savings)}/month`);
      }
    }

    return insights.slice(0, 3); // Max 3 insights
  },

  updateEfficiencyUI(efficiency) {
    // Update gauge
    this.animateGauge(efficiency.overall);

    // Update individual metrics
    document.getElementById('cpu-efficiency').textContent = `${efficiency.cpu}%`;
    document.getElementById('memory-efficiency').textContent = `${efficiency.memory}%`;
    document.getElementById('cost-optimization').textContent = `${efficiency.cost}%`;

    // Update insights
    const insightsContainer = document.getElementById('efficiency-insights');
    insightsContainer.innerHTML = efficiency.insights.map((insight, index) => {
      let className = 'insight-item';
      if (insight.includes('✅') || insight.includes('👍')) {
        className += ' insight-success';
      } else if (insight.includes('⚠️') || insight.includes('🔍')) {
        className += ' insight-warning';
      } else if (insight.includes('🚨')) {
        className += ' insight-error';
      }
      return `<div class="${className}" style="animation-delay: ${index * 0.1}s">${insight}</div>`;
    }).join('');
  },

  animateGauge(percent) {
    const valueEl = document.getElementById('efficiency-value');
    const progressPath = document.getElementById('gauge-progress');

    // Animate the number
    let current = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      current = Math.round(percent * easeOutQuart);

      valueEl.textContent = `${current}%`;

      // Update gauge path
      const angle = (percent / 100) * 180; // 0-180 degrees
      const radians = (angle - 90) * (Math.PI / 180);
      const x = 100 + 80 * Math.cos(radians);
      const y = 100 + 80 * Math.sin(radians);
      const largeArc = angle > 90 ? 1 : 0;

      progressPath.setAttribute('d', `M 20 100 A 80 80 0 ${largeArc} 1 ${x} ${y}`);

      // Update color based on percentage
      let color;
      if (percent >= 85) {
        color = '#3E8635'; // Green
      } else if (percent >= 70) {
        color = '#F0AB00'; // Yellow
      } else if (percent >= 50) {
        color = '#EC7A08'; // Orange
      } else {
        color = '#EE0000'; // Red
      }
      progressPath.setAttribute('stroke', color);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
};

// ==================== API SERVICE ====================
const API = {
  async fetchConfig() {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) throw new Error('Failed to fetch config');
      return await response.json();
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  async fetchNamespaces() {
    try {
      const response = await fetch('/api/namespaces');
      if (!response.ok) throw new Error('Failed to fetch namespaces');
      return await response.json();
    } catch (error) {
      console.error('Error fetching namespaces:', error);
      throw error;
    }
  },

  async fetchPods(namespace) {
    try {
      const response = await fetch(`/api/pods?namespace=${encodeURIComponent(namespace)}`);
      if (!response.ok) throw new Error('Failed to fetch pods');
      return await response.json();
    } catch (error) {
      console.error('Error fetching pods:', error);
      throw error;
    }
  },

  async fetchRecommendations() {
    try {
      const response = await fetch('/api/recommendations');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return await response.json();
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return null;
    }
  },

  async fetchForecast(days = 30) {
    try {
      const response = await fetch(`/api/forecast?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      return await response.json();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return null;
    }
  },

  async fetchCostTrends(hours = 168) {
    try {
      const response = await fetch(`/api/history/trends?hours=${hours}`);
      if (!response.ok) throw new Error('Failed to fetch trends');
      return await response.json();
    } catch (error) {
      console.error('Error fetching trends:', error);
      return null;
    }
  },

  async exportCSV() {
    try {
      // Show loading state
      const btn = document.getElementById('export-csv-btn');
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 0.8s linear infinite;">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        Exporting...
      `;

      const response = await fetch('/api/export/namespaces/csv');

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `costkube_export_${new Date().toISOString().split('T')[0]}.csv`;

      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Success feedback
      this.showNotification('✅ CSV exported successfully!', 'success');

      // Restore button
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('❌ Failed to export CSV. Please try again.', 'error');

      // Restore button
      const btn = document.getElementById('export-csv-btn');
      btn.disabled = false;
      btn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export CSV
      `;
    }
  },

  async exportJSON() {
    try {
      // Show loading state
      const btn = document.getElementById('export-json-btn');
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 0.8s linear infinite;">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        Exporting...
      `;

      const response = await fetch('/api/export/namespaces/json');

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `costkube_export_${new Date().toISOString().split('T')[0]}.json`;

      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Success feedback
      this.showNotification('✅ JSON exported successfully!', 'success');

      // Restore button
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('❌ Failed to export JSON. Please try again.', 'error');

      // Restore button
      const btn = document.getElementById('export-json-btn');
      btn.disabled = false;
      btn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export JSON
      `;
    }
  },

  showNotification(message, type = 'info') {
    // Remove any existing notification
    const existing = document.getElementById('notification-toast');
    if (existing) existing.remove();

    // Create notification
    const notification = document.createElement('div');
    notification.id = 'notification-toast';
    notification.className = `notification-toast notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
};

// ==================== UI CONTROLLER ====================
const UI = {
  updateConnectionStatus(isDemoMode) {
    const statusEl = document.getElementById('connection-status');
    const statusText = statusEl.querySelector('.status-text');

    if (isDemoMode) {
      statusEl.classList.add('demo');
      statusText.textContent = 'DEMO';
    } else {
      statusEl.classList.remove('demo');
      statusText.textContent = 'LIVE';
    }
  },

  showDemoAlert(show) {
    const alert = document.getElementById('demo-alert');
    alert.style.display = show ? 'block' : 'none';
  },

  updateKPIs(namespaces) {
    if (!namespaces || namespaces.length === 0) {
      this.updateKPI('total-cost', 0, 'currency');
      this.updateKPI('expensive-namespace', 'N/A');
      this.updateKPI('namespace-count', 0);
      this.updateKPI('total-cpu', 0);
      this.updateKPI('total-memory', '0 GB');
      return;
    }

    // Total monthly cost
    const totalCost = namespaces.reduce((sum, ns) => sum + ns.monthly_cost, 0);
    this.updateKPI('total-cost', totalCost, 'currency');

    // Most expensive namespace
    const mostExpensive = namespaces.reduce((max, ns) =>
      ns.monthly_cost > max.monthly_cost ? ns : max
    );
    const expensiveText = `${mostExpensive.namespace}<br><span style="font-size: 0.875rem; opacity: 0.7;">${Utils.formatCurrency(mostExpensive.monthly_cost)}/mo</span>`;
    document.getElementById('expensive-namespace').innerHTML = expensiveText;

    // Namespace count
    this.updateKPI('namespace-count', namespaces.length);

    // Total CPU
    const totalCPU = namespaces.reduce((sum, ns) => sum + ns.cpu_mcores, 0);
    document.getElementById('total-cpu').textContent = Utils.formatCores(totalCPU);

    // Total Memory
    const totalMemory = namespaces.reduce((sum, ns) => sum + ns.memory_bytes, 0);
    document.getElementById('total-memory').textContent = Utils.formatBytes(totalMemory);
  },

  updateKPI(elementId, value, format = null) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (format) element.dataset.format = format;

    if (typeof value === 'number') {
      Utils.animateValue(element, 0, value);
    } else {
      element.innerHTML = value;
    }
  },

  populateNamespaceTable(namespaces) {
    const tbody = document.getElementById('namespace-table-body');

    if (!namespaces || namespaces.length === 0) {
      tbody.innerHTML = `
        <tr class="table-loading">
          <td colspan="6">No namespace data available</td>
        </tr>
      `;
      return;
    }

    // Apply search filter
    let filteredNamespaces = namespaces;
    if (AppState.searchQuery) {
      const query = AppState.searchQuery.toLowerCase();
      filteredNamespaces = namespaces.filter(ns =>
        ns.namespace.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filteredNamespaces.sort((a, b) => {
      const aVal = a[AppState.sortColumn];
      const bVal = b[AppState.sortColumn];
      const multiplier = AppState.sortDirection === 'asc' ? 1 : -1;
      return (aVal > bVal ? 1 : -1) * multiplier;
    });

    tbody.innerHTML = filteredNamespaces.map((ns, index) => `
      <tr class="namespace-row" data-namespace="${ns.namespace}" style="animation-delay: ${index * 0.05}s">
        <td>
          <span class="namespace-badge">
            <svg style="width: 14px; height: 14px; stroke: currentColor; fill: none;" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            ${ns.namespace}
          </span>
        </td>
        <td>${Utils.formatCores(ns.cpu_mcores)}</td>
        <td>${Utils.formatBytes(ns.memory_bytes)}</td>
        <td><span class="cost-value">${Utils.formatCurrency(ns.hourly_cost)}/hr</span></td>
        <td><span class="cost-value ${Utils.getCostClass(ns.monthly_cost)}">${Utils.formatCurrency(ns.monthly_cost)}/mo</span></td>
        <td>
          <button class="sovereign-btn sovereign-btn-primary view-pods-btn" data-namespace="${ns.namespace}">
            View Pods
          </button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to "View Pods" buttons
    tbody.querySelectorAll('.view-pods-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const namespace = btn.dataset.namespace;
        DrawerManager.open(namespace);
      });
    });
  }
};

// ==================== WEBSOCKET MANAGER ====================
const WebSocketManager = {
  ws: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/metrics`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'metrics_update') {
          AppState.namespaces = data.data;
          UI.updateKPIs(data.data);
          UI.populateNamespaceTable(data.data);
          ChartManager.renderAllCharts();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.stopHeartbeat();
        this.attemptReconnect();
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  },

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000); // Ping every 30 seconds
  },

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  },

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  },

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
};

// ==================== SEARCH & FILTER MANAGER ====================
const SearchFilterManager = {
  init() {
    const searchInput = document.getElementById('namespace-search');
    const sortSelect = document.getElementById('sort-column');
    const sortDirBtn = document.getElementById('sort-direction');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        AppState.searchQuery = e.target.value;
        UI.populateNamespaceTable(AppState.namespaces);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        AppState.sortColumn = e.target.value;
        UI.populateNamespaceTable(AppState.namespaces);
      });
    }

    if (sortDirBtn) {
      sortDirBtn.addEventListener('click', () => {
        AppState.sortDirection = AppState.sortDirection === 'asc' ? 'desc' : 'asc';
        sortDirBtn.innerHTML = AppState.sortDirection === 'asc'
          ? '▲ Ascending'
          : '▼ Descending';
        UI.populateNamespaceTable(AppState.namespaces);
      });
    }
  }
};

// ==================== RECOMMENDATIONS PANEL ====================
const RecommendationsPanel = {
  async show() {
    const panel = document.getElementById('recommendations-panel');
    if (!panel) return;

    panel.innerHTML = '<div class="loading-spinner"></div><p>Loading recommendations...</p>';
    panel.style.display = 'block';

    const recommendations = await API.fetchRecommendations();

    if (!recommendations || recommendations.total_namespaces_analyzed === 0) {
      panel.innerHTML = '<p>No recommendations available yet. Data is being collected...</p>';
      return;
    }

    const html = `
      <div class="recommendations-header-banner">
        <div class="savings-highlight">
          <div class="savings-icon">💰</div>
          <div class="savings-content">
            <div class="savings-amount">${Utils.formatCurrency(recommendations.total_potential_monthly_savings)}</div>
            <div class="savings-label">Potential Monthly Savings</div>
            <div class="savings-description">Implement these recommendations to reduce your cloud costs</div>
          </div>
        </div>
      </div>

      <div class="recommendations-summary">
        <h3>💡 Cost Optimization Recommendations</h3>
        <div class="rec-stats">
          <div class="rec-stat">
            <div class="rec-stat-value">${recommendations.namespaces_with_recommendations}</div>
            <div class="rec-stat-label">Namespaces with Issues</div>
          </div>
          <div class="rec-stat">
            <div class="rec-stat-value">${recommendations.high_priority_count}</div>
            <div class="rec-stat-label">High Priority</div>
          </div>
          <div class="rec-stat">
            <div class="rec-stat-value">${recommendations.idle_resource_count}</div>
            <div class="rec-stat-label">Idle Resources</div>
          </div>
          <div class="rec-stat">
            <div class="rec-stat-value">${recommendations.total_namespaces_analyzed}</div>
            <div class="rec-stat-label">Total Analyzed</div>
          </div>
        </div>
      </div>

      ${recommendations.idle_resources.length > 0 ? `
        <div class="rec-section">
          <h4>🚨 Idle Resources</h4>
          ${recommendations.idle_resources.map(idle => `
            <div class="rec-item severity-${idle.severity}">
              <div class="rec-header">
                <span class="rec-namespace">${idle.namespace}</span>
                <span class="rec-savings">${Utils.formatCurrency(idle.potential_savings)}/mo savings</span>
              </div>
              <p>${idle.message}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${recommendations.right_sizing_recommendations.slice(0, 5).map(rec => `
        <div class="rec-section">
          <h4>📊 ${rec.namespace}</h4>
          ${rec.recommendations.map(r => `
            <div class="rec-item severity-${r.severity}">
              <div class="rec-header">
                <span class="rec-type">${r.resource}</span>
                <span class="rec-savings">${Utils.formatCurrency(r.savings)}/mo savings</span>
              </div>
              <p>${r.message}</p>
              <div class="rec-details">
                <span>Current: ${r.resource === 'CPU' ? (r.current_usage).toFixed(0) + 'm' : Utils.formatBytes(r.current_usage)}</span>
                <span>→</span>
                <span>Recommended: ${r.resource === 'CPU' ? r.recommended.toFixed(0) + 'm' : Utils.formatBytes(r.recommended)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
    `;

    panel.innerHTML = html;
  },

  hide() {
    const panel = document.getElementById('recommendations-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }
};

// ==================== DRAWER MANAGER ====================
const DrawerManager = {
  drawer: null,

  init() {
    this.drawer = document.getElementById('pod-drawer');
    const closeBtn = document.getElementById('close-drawer');
    const backdrop = this.drawer.querySelector('.drawer-backdrop');

    closeBtn?.addEventListener('click', () => this.close());
    backdrop?.addEventListener('click', () => this.close());

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.drawer.classList.contains('active')) {
        this.close();
      }
    });
  },

  async open(namespace) {
    const titleEl = document.getElementById('drawer-namespace');
    const contentEl = document.getElementById('pod-drawer-content');

    titleEl.textContent = `Pods in ${namespace}`;
    contentEl.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 1rem; color: var(--text-tertiary);">Loading pod details...</p>
      </div>
    `;

    this.drawer.classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
      const podsData = await API.fetchPods(namespace);
      this.renderPodDetails(podsData.data, namespace);
    } catch (error) {
      contentEl.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--rh-red);">
          <p>Error loading pod details</p>
        </div>
      `;
    }
  },

  close() {
    this.drawer.classList.remove('active');
    document.body.style.overflow = '';
  },

  renderPodDetails(pods, namespace) {
    const contentEl = document.getElementById('pod-drawer-content');

    if (!pods || pods.length === 0) {
      contentEl.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <p style="color: var(--text-tertiary);">No pods found in namespace <strong>${namespace}</strong></p>
        </div>
      `;
      return;
    }

    const totalCost = pods.reduce((sum, pod) => sum + pod.monthly_cost, 0);
    const totalCPU = pods.reduce((sum, pod) => sum + pod.cpu_mcores, 0);
    const totalMemory = pods.reduce((sum, pod) => sum + pod.memory_bytes, 0);

    contentEl.innerHTML = `
      <div class="drawer-summary">
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total Pods</span>
          </div>
          <div class="kpi-value">${pods.length}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">Total Cost</span>
          </div>
          <div class="kpi-value">${Utils.formatCurrency(totalCost)}</div>
          <div class="kpi-trend"><span class="trend-text">per month</span></div>
        </div>
      </div>

      <table class="pod-table">
        <thead>
          <tr>
            <th>Pod Name</th>
            <th>CPU (cores)</th>
            <th>Memory</th>
            <th>Hourly Cost</th>
            <th>Monthly Cost</th>
          </tr>
        </thead>
        <tbody>
          ${pods.map(pod => `
            <tr>
              <td><span class="pod-name">${pod.pod}</span></td>
              <td>${Utils.formatCores(pod.cpu_mcores)}</td>
              <td>${Utils.formatBytes(pod.memory_bytes)}</td>
              <td><span class="cost-value">${Utils.formatCurrency(pod.hourly_cost)}/hr</span></td>
              <td><span class="cost-value ${Utils.getCostClass(pod.monthly_cost)}">${Utils.formatCurrency(pod.monthly_cost)}/mo</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
};

// ==================== TOOLTIP MANAGER ====================
const TooltipManager = {
  tooltip: null,

  init() {
    this.tooltip = document.getElementById('tooltip');

    // Add event listeners to all info buttons
    document.addEventListener('mouseover', (e) => {
      const infoBtn = e.target.closest('.info-btn');
      if (infoBtn) {
        const text = infoBtn.dataset.tooltip;
        if (text) {
          this.show(text, infoBtn);
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const infoBtn = e.target.closest('.info-btn');
      if (infoBtn) {
        this.hide();
      }
    });
  },

  show(text, element) {
    if (!this.tooltip) return;

    this.tooltip.textContent = text;
    this.tooltip.classList.add('show');

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.bottom + 12;

    // Keep tooltip within viewport
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  },

  hide() {
    if (!this.tooltip) return;
    this.tooltip.classList.remove('show');
  }
};

// ==================== CHART MANAGER ====================
const ChartManager = {
  getChartDefaults() {
    const isDark = ThemeManager.isDark();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: isDark ? '#C7C9CA' : '#4F5255',
            font: {
              family: "'Red Hat Text', sans-serif",
              size: 12,
            },
            padding: 16,
            usePointStyle: true,
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#212427' : '#FFFFFF',
          titleColor: isDark ? '#FFFFFF' : '#111111',
          bodyColor: isDark ? '#C7C9CA' : '#4F5255',
          borderColor: isDark ? '#3C4146' : '#D2D3D5',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed !== null) {
                label += Utils.formatCurrency(context.parsed);
              }
              return label;
            }
          }
        }
      }
    };
  },

  renderCostDistribution() {
    const canvas = document.getElementById('cost-distribution-chart');
    if (!canvas) return;

    const namespaces = AppState.namespaces.slice(0, 8); // Top 8
    const ctx = canvas.getContext('2d');

    if (AppState.charts.distribution) {
      AppState.charts.distribution.destroy();
    }

    AppState.charts.distribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: namespaces.map(ns => ns.namespace),
        datasets: [{
          label: 'Monthly Cost',
          data: namespaces.map(ns => ns.monthly_cost),
          backgroundColor: ChartColors.palette,
          borderWidth: 2,
          borderColor: ThemeManager.isDark() ? '#1A1C1C' : '#FFFFFF',
        }]
      },
      options: {
        ...this.getChartDefaults(),
        cutout: '65%',
        plugins: {
          ...this.getChartDefaults().plugins,
          legend: {
            ...this.getChartDefaults().plugins.legend,
            position: 'right',
          }
        }
      }
    });
  },

  renderResourceChart() {
    const canvas = document.getElementById('resource-chart');
    if (!canvas) return;

    const namespaces = AppState.namespaces.slice(0, 6);
    const ctx = canvas.getContext('2d');

    if (AppState.charts.resource) {
      AppState.charts.resource.destroy();
    }

    AppState.charts.resource = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: namespaces.map(ns => ns.namespace),
        datasets: [
          {
            label: 'CPU (cores)',
            data: namespaces.map(ns => ns.cpu_mcores / 1000),
            backgroundColor: ChartColors.red,
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Memory (GB)',
            data: namespaces.map(ns => ns.memory_bytes / (1024 ** 3)),
            backgroundColor: ChartColors.blue,
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        ...this.getChartDefaults(),
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: ThemeManager.isDark() ? '#8A8D90' : '#6A6E73',
              font: {
                family: "'Red Hat Text', sans-serif",
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: ThemeManager.isDark() ? '#2E3236' : '#E5E5E5',
            },
            ticks: {
              color: ThemeManager.isDark() ? '#8A8D90' : '#6A6E73',
              font: {
                family: "'Red Hat Text', sans-serif",
              }
            }
          }
        }
      }
    });
  },

  renderTrendChart() {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const chartContainer = canvas.parentElement;

    if (AppState.charts.trend) {
      AppState.charts.trend.destroy();
    }

    // Check if we have sufficient data for a meaningful chart
    const hasHistoricalData = AppState.trendData && AppState.trendData.timestamps && AppState.trendData.timestamps.length >= 2;
    const hasForecastData = AppState.forecast && AppState.forecast.forecast_dates && AppState.forecast.forecast_dates.length > 0;

    // ---- CONDITIONAL RENDERING: Check data sufficiency ----
    if (!hasHistoricalData && !hasForecastData) {
      // INSUFFICIENT DATA: Render empty state instead of broken chart
      chartContainer.innerHTML = `
        <div class="chart-empty-state">
          <svg class="chart-empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"></path>
            <path d="M18 17l-5-5-4 4-5-5"></path>
          </svg>
          <h3>Cost Trend Analysis</h3>
          <p>Collecting data for trend analysis...</p>
          <p>Check back in 24 hours to see your cost trends.</p>
        </div>
      `;
      return;
    }

    // SUFFICIENT DATA: Ensure canvas exists (might have been replaced by empty state)
    if (chartContainer.querySelector('.chart-empty-state')) {
      chartContainer.innerHTML = '<canvas id="trend-chart"></canvas>';
      const newCanvas = document.getElementById('trend-chart');
      const newCtx = newCanvas.getContext('2d');

      // Re-assign to the new canvas
      canvas = newCanvas;
      ctx = newCtx;
    }

    // Use historical data if available, otherwise generate demo trend
    if (hasHistoricalData) {
      const timestamps = AppState.trendData.timestamps.map(ts => {
        const date = new Date(ts);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      const costs = AppState.trendData.costs;

      // Add forecast data if available
      let forecastTimestamps = [];
      let forecastCosts = [];

      if (hasForecastData) {
        forecastTimestamps = AppState.forecast.forecast_dates.slice(0, 7).map(ts => {
          const date = new Date(ts);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        forecastCosts = AppState.forecast.forecast_costs.slice(0, 7);
      }

      AppState.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [...timestamps, ...forecastTimestamps],
          datasets: [{
            label: 'Historical Cost',
            data: [...costs, ...Array(forecastCosts.length).fill(null)],
            borderColor: ChartColors.red,
            backgroundColor: `${ChartColors.red}20`,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: ChartColors.red,
            pointBorderColor: ThemeManager.isDark() ? '#1A1C1C' : '#FFFFFF',
            pointBorderWidth: 2,
          }, {
            label: 'Forecast',
            data: [...Array(costs.length).fill(null), ...forecastCosts],
            borderColor: ChartColors.orange,
            backgroundColor: `${ChartColors.orange}20`,
            borderWidth: 3,
            borderDash: [5, 5],
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: ChartColors.orange,
            pointBorderColor: ThemeManager.isDark() ? '#1A1C1C' : '#FFFFFF',
            pointBorderWidth: 2,
          }]
        },
        options: {
          ...this.getChartDefaults(),
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                color: ThemeManager.isDark() ? '#8A8D90' : '#6A6E73',
                font: {
                  family: "'Red Hat Text', sans-serif",
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: ThemeManager.isDark() ? '#2E3236' : '#E5E5E5',
              },
              ticks: {
                color: ThemeManager.isDark() ? '#8A8D90' : '#6A6E73',
                font: {
                  family: "'Red Hat Text', sans-serif",
                },
                callback: function(value) {
                  return Utils.formatCurrency(value);
                }
              }
            }
          }
        }
      });
    } else {
      // Fallback to demo data (only if we have namespace data)
      if (AppState.namespaces.length === 0) {
        // Show empty state if no namespace data either
        chartContainer.innerHTML = `
          <div class="chart-empty-state">
            <svg class="chart-empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"></path>
              <path d="M18 17l-5-5-4 4-5-5"></path>
            </svg>
            <h3>Cost Trend Analysis</h3>
            <p>No data available yet.</p>
            <p>Start using your cluster to see cost trends.</p>
          </div>
        `;
        return;
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const totalCost = AppState.namespaces.reduce((sum, ns) => sum + ns.monthly_cost, 0);
      const trendData = months.map((_, i) => totalCost * (0.7 + (i * 0.05)));

      AppState.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Monthly Cost Trend',
            data: trendData,
            borderColor: ChartColors.red,
            backgroundColor: `${ChartColors.red}20`,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: ChartColors.red,
            pointBorderColor: ThemeManager.isDark() ? '#1A1C1C' : '#FFFFFF',
            pointBorderWidth: 2,
          }]
        },
        options: {
          ...this.getChartDefaults(),
          scales: {
            x: {
              grid: {
                display: false,
              },
              ticks: {
                color: ThemeManager.isDark() ? '#8A8D90' : '#6A6E73',
                font: {
                  family: "'Red Hat Text', sans-serif",
                }
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: ThemeManager.isDark() ? '#2E3236' : '#E5E5E5',
              },
              ticks: {
                color: ThemeManager.isDark() ? '#8A8D90' : '#6A6E73',
                font: {
                  family: "'Red Hat Text', sans-serif",
                },
                callback: function(value) {
                  return Utils.formatCurrency(value);
                }
              }
            }
          }
        }
      });
    }
  },

  renderAllCharts() {
    if (AppState.namespaces.length > 0) {
      this.renderCostDistribution();
      this.renderResourceChart();
      this.renderTrendChart();
    }
  }
};

// ==================== APP CONTROLLER ====================
const App = {
  async init() {
    console.log('🚀 Initializing CostKube - Kubernetes Cost Analytics Platform v2.0');

    // Show loading page for cold start detection
    LoadingPage.show();

    // Initialize theme
    ThemeManager.init();

    // Initialize drawer
    DrawerManager.init();

    // Initialize tooltips
    TooltipManager.init();

    // Initialize search & filter
    SearchFilterManager.init();

    // Set up refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn?.addEventListener('click', async () => {
      const originalHTML = refreshBtn.innerHTML;
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 0.8s linear infinite;">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        Refreshing...
      `;

      await this.loadDashboard();

      refreshBtn.disabled = false;
      refreshBtn.innerHTML = originalHTML;
      API.showNotification('✅ Dashboard refreshed!', 'success');
    });

    // Set up export buttons
    const exportCSVBtn = document.getElementById('export-csv-btn');
    exportCSVBtn?.addEventListener('click', () => API.exportCSV());

    const exportJSONBtn = document.getElementById('export-json-btn');
    exportJSONBtn?.addEventListener('click', () => API.exportJSON());

    // Set up recommendations button
    const recommendationsBtn = document.getElementById('show-recommendations-btn');
    recommendationsBtn?.addEventListener('click', () => RecommendationsPanel.show());

    // Load dashboard data
    await this.loadDashboard();

    // Initialize WebSocket for real-time updates
    try {
      WebSocketManager.connect();
    } catch (error) {
      console.warn('WebSocket not available, using polling fallback');
      // Fallback to polling every 30 seconds
      setInterval(() => this.loadDashboard(), 30000);
    }

    // Hide loading page once ready
    setTimeout(() => LoadingPage.hide(), 500);

    console.log('✅ Dashboard initialized successfully');
  },

  async loadDashboard() {
    try {
      // Fetch config
      const config = await API.fetchConfig();
      AppState.config = config;
      AppState.isDemoMode = config.demo_mode;

      // Update UI for demo mode
      UI.updateConnectionStatus(AppState.isDemoMode);
      UI.showDemoAlert(AppState.isDemoMode);

      // Fetch namespaces
      const namespacesData = await API.fetchNamespaces();
      AppState.namespaces = namespacesData.data || [];

      // Update UI
      UI.updateKPIs(AppState.namespaces);
      UI.populateNamespaceTable(AppState.namespaces);

      // Fetch recommendations first to calculate efficiency
      const recommendations = await API.fetchRecommendations();
      if (recommendations) {
        AppState.recommendations = recommendations;
        this.displayRecommendationsSummary(recommendations);
      }

      // Calculate and display efficiency score
      const efficiency = EfficiencyCalculator.calculateEfficiency(
        AppState.namespaces,
        AppState.recommendations
      );
      EfficiencyCalculator.updateEfficiencyUI(efficiency);

      // Fetch historical trends (don't block on this)
      API.fetchCostTrends().then(trends => {
        if (trends && trends.timestamps) {
          AppState.trendData = trends;
        }
        ChartManager.renderAllCharts();
      });

      // Fetch forecast (don't block on this)
      API.fetchForecast(30).then(forecast => {
        if (forecast && !forecast.error) {
          AppState.forecast = forecast;
          ChartManager.renderTrendChart(); // Re-render with forecast
          this.displayForecastSummary(forecast);
        }
      });

      // Render base charts immediately
      ChartManager.renderCostDistribution();
      ChartManager.renderResourceChart();

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      this.showError('Failed to load dashboard data. Please refresh the page.');
      LoadingPage.hide(); // Hide loading on error too
    }
  },

  displayForecastSummary(forecast) {
    const container = document.getElementById('forecast-summary');
    if (!container) return;

    // Check if we have valid forecast data
    if (!forecast || forecast.error || !forecast.forecast_monthly_total) {
      container.innerHTML = `
        <div class="forecast-card" style="background: linear-gradient(135deg, var(--pf-gray) 0%, var(--rh-gray-70) 100%);">
          <div class="forecast-header">
            <h4>📊 30-Day Cost Forecast</h4>
          </div>
          <div class="forecast-body">
            <div class="forecast-value" style="font-size: 1.5rem;">Collecting Data...</div>
            <div class="forecast-change" style="opacity: 0.8; font-size: 0.95rem;">
              Insufficient historical data for accurate forecast
            </div>
            <div class="forecast-details" style="font-size: 0.875rem; opacity: 0.7;">
              <span>📈 Data collection in progress</span>
              <span>⏱️ Check back in 24 hours</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const changePercent = ((forecast.forecast_monthly_total - forecast.current_monthly_cost) / forecast.current_monthly_cost * 100).toFixed(1);
    const trendIcon = forecast.trend === 'increasing' ? '📈' : forecast.trend === 'decreasing' ? '📉' : '➡️';
    const changeColor = forecast.trend === 'increasing' ? '#FFD700' : forecast.trend === 'decreasing' ? '#90EE90' : '#FFF';

    container.innerHTML = `
      <div class="forecast-card">
        <div class="forecast-header">
          <h4>${trendIcon} 30-Day Cost Forecast</h4>
        </div>
        <div class="forecast-body">
          <div class="forecast-value">${Utils.formatCurrency(forecast.forecast_monthly_total)}</div>
          <div class="forecast-change" style="color: ${changeColor};">
            ${changePercent > 0 ? '+' : ''}${changePercent}% vs current trend
          </div>
          <div class="forecast-details">
            <span>Trend: <strong>${forecast.trend}</strong></span>
            <span>Confidence: <strong>${forecast.confidence || 'High'}</strong></span>
            ${forecast.method ? `<span>Method: ${forecast.method}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  displayRecommendationsSummary(recommendations) {
    // Recommendations summary removed - now only shown inside the panel
    // Users can access via the "Recommendations" button in the section header
    return;
  },

  showError(message) {
    const tbody = document.getElementById('namespace-table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr class="table-loading">
          <td colspan="6" style="color: var(--rh-red);">
            <svg style="width: 24px; height: 24px; stroke: currentColor; fill: none; margin-bottom: 1rem;" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <br>${message}
          </td>
        </tr>
      `;
    }
  }
};

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Add custom styles for drawer summary
const style = document.createElement('style');
style.textContent = `
  .drawer-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--space-lg);
    margin-bottom: var(--space-xl);
  }

  .drawer-summary .kpi-card {
    margin: 0;
  }
`;
document.head.appendChild(style);
