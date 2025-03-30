// Dashboard state management
const state = {
    currentView: 'overview',
    dateRange: '24h',
    metrics: {},
    alerts: [],
    isExportMenuOpen: false,
    isSettingsModalOpen: false,
    thresholds: {
        errorRate: 5,
        transactionVolume: 1000,
        responseTime: 2000
    }
};

// WebSocket connection
const socket = io();

// DOM Elements
const elements = {
    exportMenu: document.querySelector('.export-menu'),
    exportButton: document.querySelector('.export-button'),
    settingsButton: document.querySelector('.settings-button'),
    settingsModal: document.querySelector('.settings-modal'),
    dateRangeButtons: document.querySelectorAll('.range-btn'),
    viewButtons: document.querySelectorAll('.view-btn'),
    dashboardViews: document.querySelectorAll('.dashboard-view'),
    metricsGrid: document.querySelector('.metrics-grid'),
    alertsList: document.querySelector('.alerts-list'),
    transactionChart: document.getElementById('transactionChart'),
    errorChart: document.getElementById('errorChart'),
    thresholdInputs: document.querySelectorAll('.threshold-input')
};

// Initialize dashboard
function initDashboard() {
    setupEventListeners();
    setupWebSocket();
    loadInitialData();
    setupCharts();
}

// Event Listeners
function setupEventListeners() {
    // Export menu
    elements.exportButton.addEventListener('click', toggleExportMenu);
    document.addEventListener('click', handleExportMenuClick);

    // Settings modal
    elements.settingsButton.addEventListener('click', toggleSettingsModal);
    document.querySelector('.close-modal').addEventListener('click', toggleSettingsModal);

    // Date range and view selectors
    elements.dateRangeButtons.forEach(btn => {
        btn.addEventListener('click', () => updateDateRange(btn.dataset.range));
    });

    elements.viewButtons.forEach(btn => {
        btn.addEventListener('click', () => updateView(btn.dataset.view));
    });

    // Threshold inputs
    elements.thresholdInputs.forEach(input => {
        input.addEventListener('change', updateThreshold);
    });
}

// WebSocket setup
function setupWebSocket() {
    socket.on('connect', () => {
        console.log('WebSocket connected');
    });

    socket.on('metrics_update', updateMetrics);
    socket.on('alert', handleNewAlert);
    socket.on('transaction_update', updateTransactionChart);
    socket.on('error_update', updateErrorChart);
}

// Data loading
async function loadInitialData() {
    try {
        const response = await fetch('/api/dashboard/initial-data');
        const data = await response.json();
        
        state.metrics = data.metrics;
        state.alerts = data.alerts;
        
        updateMetricsDisplay();
        updateAlertsList();
        updateCharts(data);
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// UI Updates
function updateMetricsDisplay() {
    const metricsGrid = elements.metricsGrid;
    metricsGrid.innerHTML = '';

    Object.entries(state.metrics).forEach(([key, value]) => {
        const metricItem = createMetricElement(key, value);
        metricsGrid.appendChild(metricItem);
    });
}

function createMetricElement(key, value) {
    const div = document.createElement('div');
    div.className = 'metric-item';
    
    const label = document.createElement('span');
    label.className = 'metric-label';
    label.textContent = formatMetricLabel(key);
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'metric-value';
    valueSpan.textContent = formatMetricValue(key, value);
    
    const statusDot = document.createElement('span');
    statusDot.className = `status-dot ${getMetricStatus(key, value)}`;
    
    div.appendChild(label);
    div.appendChild(valueSpan);
    div.appendChild(statusDot);
    
    return div;
}

function updateAlertsList() {
    const alertsList = elements.alertsList;
    alertsList.innerHTML = '';

    state.alerts.forEach(alert => {
        const alertElement = createAlertElement(alert);
        alertsList.appendChild(alertElement);
    });
}

function createAlertElement(alert) {
    const div = document.createElement('div');
    div.className = `alert-item ${alert.severity}`;
    
    const header = document.createElement('div');
    header.className = 'alert-header';
    
    const type = document.createElement('span');
    type.className = 'alert-type';
    type.textContent = alert.type;
    
    const time = document.createElement('span');
    time.className = 'alert-time';
    time.textContent = formatTime(alert.timestamp);
    
    const message = document.createElement('p');
    message.className = 'alert-message';
    message.textContent = alert.message;
    
    header.appendChild(type);
    header.appendChild(time);
    div.appendChild(header);
    div.appendChild(message);
    
    return div;
}

// Chart setup and updates
function setupCharts() {
    const transactionCtx = elements.transactionChart.getContext('2d');
    const errorCtx = elements.errorChart.getContext('2d');

    window.transactionChart = new Chart(transactionCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Transaction Volume',
                data: [],
                borderColor: '#007AFF',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    window.errorChart = new Chart(errorCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Error Rate',
                data: [],
                backgroundColor: '#F44336'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateTransactionChart(data) {
    window.transactionChart.data.labels = data.labels;
    window.transactionChart.data.datasets[0].data = data.values;
    window.transactionChart.update();
}

function updateErrorChart(data) {
    window.errorChart.data.labels = data.labels;
    window.errorChart.data.datasets[0].data = data.values;
    window.errorChart.update();
}

// UI State Management
function toggleExportMenu() {
    state.isExportMenuOpen = !state.isExportMenuOpen;
    elements.exportMenu.classList.toggle('hidden');
}

function toggleSettingsModal() {
    state.isSettingsModalOpen = !state.isSettingsModalOpen;
    elements.settingsModal.classList.toggle('hidden');
}

function updateDateRange(range) {
    state.dateRange = range;
    elements.dateRangeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.range === range);
    });
    loadDataForRange(range);
}

function updateView(view) {
    state.currentView = view;
    elements.viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    elements.dashboardViews.forEach(dashboard => {
        dashboard.classList.toggle('active', dashboard.dataset.view === view);
    });
}

// Utility functions
function formatMetricLabel(key) {
    return key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatMetricValue(key, value) {
    switch (key) {
        case 'transaction_volume':
            return value.toLocaleString();
        case 'error_rate':
            return `${value.toFixed(2)}%`;
        case 'response_time':
            return `${value}ms`;
        default:
            return value;
    }
}

function getMetricStatus(key, value) {
    const threshold = state.thresholds[key];
    if (!threshold) return 'healthy';

    if (value > threshold * 1.5) return 'error';
    if (value > threshold) return 'warning';
    return 'healthy';
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString();
}

// Export functionality
async function exportData(format) {
    try {
        const response = await fetch(`/api/dashboard/export?format=${format}`);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting data:', error);
    }
}

// Threshold management
async function updateThreshold(event) {
    const { name, value } = event.target;
    state.thresholds[name] = Number(value);

    try {
        await fetch('/api/dashboard/thresholds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state.thresholds)
        });
    } catch (error) {
        console.error('Error updating thresholds:', error);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard); 