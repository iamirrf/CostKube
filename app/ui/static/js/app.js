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

    tbody.innerHTML = namespaces.map((ns, index) => `
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

    if (AppState.charts.trend) {
      AppState.charts.trend.destroy();
    }

    // Generate demo trend data
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
    console.log('🚀 Initializing CostKube - Kubernetes Cost Analytics Platform');

    // Show loading page for cold start detection
    LoadingPage.show();

    // Initialize theme
    ThemeManager.init();

    // Initialize drawer
    DrawerManager.init();

    // Initialize tooltips
    TooltipManager.init();

    // Set up refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    refreshBtn?.addEventListener('click', () => this.loadDashboard());

    // Load dashboard data
    await this.loadDashboard();

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

      // Render charts
      ChartManager.renderAllCharts();

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      this.showError('Failed to load dashboard data. Please refresh the page.');
      LoadingPage.hide(); // Hide loading on error too
    }
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
