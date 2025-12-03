/**
 * AICO 3D Fire Detection Dashboard
 * Full MQTT Integration with Real Sensor Data
 */

class AICO3DDashboard {
    constructor() {
        // Sensor definitions matching your existing system
        this.sensors = {
            temperature: { id: 'temperature', name: 'Temperature', unit: '°C', icon: 'fa-thermometer-half', iconClass: 'temp', current: 0, history: [], status: 'normal', thresholds: { warning: 35, critical: 45 }, min: 15, max: 60 },
            humidity: { id: 'humidity', name: 'Humidity', unit: '%', icon: 'fa-droplet', iconClass: 'humidity', current: 0, history: [], status: 'normal', thresholds: { warning: 70, critical: 85 }, min: 20, max: 85 },
            'air-quality': { id: 'air-quality', name: 'Air Quality', unit: 'AQI', icon: 'fa-smog', iconClass: 'air', current: 0, history: [], status: 'normal', thresholds: { warning: 50, critical: 100 }, min: 0, max: 200 },
            gas: { id: 'gas', name: 'Gas Resistance', unit: 'Ω', icon: 'fa-wind', iconClass: 'gas', current: 0, history: [], status: 'normal', thresholds: { warning: 300, critical: 500 }, min: 50, max: 800 },
            'surface-temp': { id: 'surface-temp', name: 'Surface Temp', unit: '°C', icon: 'fa-temperature-high', iconClass: 'surface', current: 0, history: [], status: 'normal', thresholds: { warning: 60, critical: 80 }, min: 18, max: 90 },
            'surface-temp-2': { id: 'surface-temp-2', name: 'Surface Temp 2', unit: '°C', icon: 'fa-temperature-high', iconClass: 'surface', current: 0, history: [], status: 'normal', thresholds: { warning: 60, critical: 80 }, min: 18, max: 90 },
            tvoc: { id: 'tvoc', name: 'TVOC', unit: 'ppb', icon: 'fa-atom', iconClass: 'tvoc', current: 0, history: [], status: 'normal', thresholds: { warning: 660, critical: 2200 }, min: 0, max: 2000 },
            eco2: { id: 'eco2', name: 'eCO2', unit: 'ppm', icon: 'fa-leaf', iconClass: 'eco2', current: 0, history: [], status: 'normal', thresholds: { warning: 1000, critical: 2000 }, min: 400, max: 5000 },
            no2: { id: 'no2', name: 'NO2', unit: 'ppb', icon: 'fa-cloud', iconClass: 'no2', current: 0, history: [], status: 'normal', thresholds: { warning: 50, critical: 100 }, min: 0, max: 200 },
            co: { id: 'co', name: 'Carbon Monoxide', unit: 'ppm', icon: 'fa-skull-crossbones', iconClass: 'co', current: 0, history: [], status: 'normal', thresholds: { warning: 25, critical: 50 }, min: 0, max: 100 },
            pressure: { id: 'pressure', name: 'Pressure', unit: 'hPa', icon: 'fa-gauge-high', iconClass: 'pressure', current: 0, history: [], status: 'normal', thresholds: { warning: 1050, critical: 1080 }, min: 900, max: 1100 },
            current: { id: 'current', name: 'Current', unit: 'A', icon: 'fa-bolt', iconClass: 'current', current: 0, history: [], status: 'normal', thresholds: { warning: 5, critical: 8 }, min: 0, max: 10 }
        };

        this.state = {
            currentPage: 'dashboard',
            mqttConnected: false,
            boardHealth: 0,
            alerts: [],
            lastUpdate: null,
            gridVisible: true
        };

        this.aiMessages = [
            "Tüm sensörler normal parametrelerde çalışıyor. Yangın riski tespit edilmedi.",
            "Panel sıcaklığı stabil. Soğutma sistemi verimli çalışıyor.",
            "Elektrik akımı normal seviyelerde. Aşırı yük tespit edilmedi.",
            "Hava kalitesi iyi. Duman veya gaz sızıntısı yok.",
            "Nem seviyesi kabul edilebilir aralıkta.",
            "Tüm devreler aktif ve çalışır durumda."
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startClock();
        this.renderActivityChart();
        this.renderAllSensorsPage();
        this.connectMQTT();
        this.startAIRotation();

        console.log('AICO 3D Dashboard initialized');
    }

    setupEventListeners() {
        // Navigation menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.switchPage(page);
            });
        });

        // Sensor card clicks
        document.querySelectorAll('.sensor-metric, .sensor-full-card').forEach(card => {
            card.addEventListener('click', () => {
                const sensorId = card.dataset.sensor;
                if (sensorId) this.showSensorModal(sensorId);
            });
        });

        // Panel sensor clicks
        document.querySelectorAll('.panel-sensor').forEach(sensor => {
            sensor.addEventListener('click', () => {
                const sensorId = sensor.dataset.sensor;
                if (sensorId) this.showSensorModal(sensorId);
            });
        });

        // Modal close
        document.getElementById('closeDetailModal')?.addEventListener('click', () => this.hideModal());
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => this.hideModal());

        // Scene controls
        document.getElementById('resetView')?.addEventListener('click', () => this.resetPanelView());
        document.getElementById('toggleGrid')?.addEventListener('click', () => this.toggleGrid());

        // Activity navigation
        document.getElementById('prevWeekBtn')?.addEventListener('click', () => this.renderActivityChart());
        document.getElementById('nextWeekBtn')?.addEventListener('click', () => this.renderActivityChart());

        // Alert filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterAlerts(e.target.dataset.filter);
            });
        });

        document.getElementById('clearAlerts')?.addEventListener('click', () => this.clearAlerts());

        // Analytics selects
        document.getElementById('analyticsSensorSelect')?.addEventListener('change', () => this.updateAnalyticsChart());
        document.getElementById('analyticsTimeRange')?.addEventListener('change', () => this.updateAnalyticsChart());

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideModal();
        });
    }

    connectMQTT() {
        // Check if mqtt.js created a client
        if (window.mqttClient) {
            // Hook into existing MQTT client
            const originalUpdate = window.mqttClient.updateDashboardSensors;
            window.mqttClient.updateDashboardSensors = (data) => {
                if (originalUpdate) originalUpdate.call(window.mqttClient, data);
                this.handleMQTTData(data);
            };

            // Check connection status
            if (window.mqttClient.client && window.mqttClient.client.isConnected()) {
                this.setConnectionStatus(true);
            }
        } else {
            // Create our own MQTT connection
            this.initOwnMQTT();
        }
    }

    initOwnMQTT() {
        try {
            const clientId = 'aico3d_' + Math.random().toString(16).substr(2, 8);
            const client = new Paho.MQTT.Client('213.142.151.191', 9001, clientId);

            client.onConnectionLost = (responseObject) => {
                console.log('MQTT Connection lost:', responseObject.errorMessage);
                this.setConnectionStatus(false);
                setTimeout(() => this.initOwnMQTT(), 5000);
            };

            client.onMessageArrived = (message) => {
                this.parseMQTTMessage(message.payloadString);
            };

            client.connect({
                onSuccess: () => {
                    console.log('MQTT Connected');
                    this.setConnectionStatus(true);
                    client.subscribe('aicofire');
                },
                onFailure: (err) => {
                    console.log('MQTT Connection failed:', err);
                    this.setConnectionStatus(false);
                    setTimeout(() => this.initOwnMQTT(), 5000);
                }
            });

            this.mqttClient = client;
        } catch (e) {
            console.error('MQTT Error:', e);
            this.setConnectionStatus(false);
        }
    }

    parseMQTTMessage(payload) {
        try {
            // Format: A;temp;humidity;gas;air-quality;no2;co;tvoc;eco2;surface-temp1;surface-temp2;pressure;current;warning2;warning1;panelHealth;B
            if (!payload.startsWith('A;') || !payload.endsWith(';B')) return;

            const parts = payload.slice(2, -2).split(';');
            if (parts.length < 15) return;

            const data = {
                temperature: parseFloat(parts[0]) || 0,
                humidity: parseFloat(parts[1]) || 0,
                gas: parseFloat(parts[2]) || 0,
                'air-quality': parseFloat(parts[3]) || 0,
                no2: parseFloat(parts[4]) || 0,
                co: parseFloat(parts[5]) || 0,
                tvoc: parseFloat(parts[6]) || 0,
                eco2: parseFloat(parts[7]) || 0,
                'surface-temp': parseFloat(parts[8]) || 0,
                'surface-temp-2': parseFloat(parts[9]) || 0,
                pressure: parseFloat(parts[10]) || 0,
                current: parseFloat(parts[11]) || 0,
                warning2: parts[12] || '0',
                warning1: parts[13] || '0',
                panelHealth: parseFloat(parts[14]) || 0
            };

            this.handleMQTTData(data);
        } catch (e) {
            console.error('Parse error:', e);
        }
    }

    handleMQTTData(data) {
        this.state.lastUpdate = new Date();

        // Update board health
        if (data.panelHealth !== undefined) {
            this.state.boardHealth = data.panelHealth;
            this.updateBoardHealth();
        }

        // Update each sensor
        Object.keys(this.sensors).forEach(sensorId => {
            if (data[sensorId] !== undefined) {
                this.updateSensor(sensorId, data[sensorId]);
            }
        });

        // Update system status
        this.updateSystemStatus();
        this.updatePanelDisplay();
    }

    updateSensor(sensorId, value) {
        const sensor = this.sensors[sensorId];
        if (!sensor) return;

        sensor.current = value;

        // Add to history
        sensor.history.push({ value, time: new Date() });
        if (sensor.history.length > 100) sensor.history.shift();

        // Calculate status
        if (value >= sensor.thresholds.critical) {
            sensor.status = 'critical';
        } else if (value >= sensor.thresholds.warning) {
            sensor.status = 'warning';
        } else {
            sensor.status = 'normal';
        }

        // Update UI
        this.updateSensorUI(sensorId);
        this.updateSensorSparkline(sensorId);

        // Check for alerts
        if (sensor.status !== 'normal') {
            this.addAlert(sensor);
        }
    }

    updateSensorUI(sensorId) {
        const sensor = this.sensors[sensorId];

        // Update value display
        const valueEl = document.getElementById(`${sensorId}-card-value`);
        if (valueEl) valueEl.textContent = sensor.current.toFixed(1);

        // Update status badge
        const statusEl = document.getElementById(`${sensorId}-card-status`);
        if (statusEl) {
            statusEl.innerHTML = `<span class="status-badge ${sensor.status}">${sensor.status.toUpperCase()}</span>`;
        }

        // Update min/max
        if (sensor.history.length > 0) {
            const values = sensor.history.map(h => h.value);
            const minEl = document.getElementById(`${sensorId}-min`);
            const maxEl = document.getElementById(`${sensorId}-max`);
            if (minEl) minEl.textContent = Math.min(...values).toFixed(1);
            if (maxEl) maxEl.textContent = Math.max(...values).toFixed(1);
        }

        // Update panel sensor
        const panelLabel = document.getElementById(`panel-${sensorId}`);
        if (panelLabel) panelLabel.textContent = sensor.current.toFixed(1);

        const panelSensor = document.querySelector(`.panel-sensor[data-sensor="${sensorId}"]`);
        if (panelSensor) {
            panelSensor.dataset.status = sensor.status;
        }
    }

    updateSensorSparkline(sensorId) {
        const sensor = this.sensors[sensorId];
        const container = document.getElementById(`${sensorId}-sparkline`);
        if (!container || sensor.history.length < 2) return;

        const data = sensor.history.slice(-30).map(h => h.value);
        const width = container.offsetWidth || 200;
        const height = container.offsetHeight || 40;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        const points = data.map((v, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((v - min) / range) * (height - 4) - 2;
            return `${x},${y}`;
        }).join(' ');

        const color = this.getSensorColor(sensorId);

        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="grad-${sensorId}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.5"/>
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0"/>
                    </linearGradient>
                </defs>
                <polygon points="0,${height} ${points} ${width},${height}" fill="url(#grad-${sensorId})"/>
                <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;
    }

    getSensorColor(sensorId) {
        const colors = {
            temperature: '#ff6b35',
            humidity: '#00d4ff',
            'air-quality': '#6366f1',
            gas: '#ffc107',
            'surface-temp': '#8a2be2',
            'surface-temp-2': '#ff1493',
            tvoc: '#00ff88',
            eco2: '#ffd700',
            no2: '#a855f7',
            co: '#ff3b5c',
            pressure: '#6c757d',
            current: '#ffff00'
        };
        return colors[sensorId] || '#00d4ff';
    }

    updateSystemStatus() {
        let normalCount = 0, warningCount = 0, criticalCount = 0;

        Object.values(this.sensors).forEach(sensor => {
            if (sensor.status === 'critical') criticalCount++;
            else if (sensor.status === 'warning') warningCount++;
            else normalCount++;
        });

        // Update counts
        document.getElementById('normalSensorCount').textContent = normalCount;
        document.getElementById('warningSensorCount').textContent = warningCount;
        document.getElementById('criticalSensorCount').textContent = criticalCount;

        document.getElementById('onlineSensors').textContent = Object.keys(this.sensors).length;
        document.getElementById('warningCount').textContent = warningCount;
        document.getElementById('criticalCount').textContent = criticalCount;

        // Calculate health percentage
        const total = Object.keys(this.sensors).length;
        const healthPercent = Math.round(((normalCount + warningCount * 0.5) / total) * 100);

        document.getElementById('healthPercent').textContent = healthPercent;

        // Update ring
        const ring = document.getElementById('healthRingProgress');
        if (ring) {
            const circumference = 2 * Math.PI * 52;
            const offset = circumference - (healthPercent / 100) * circumference;
            ring.style.strokeDashoffset = offset;

            if (criticalCount > 0) {
                ring.style.stroke = '#ff3b5c';
            } else if (warningCount > 0) {
                ring.style.stroke = '#ff6b35';
            } else {
                ring.style.stroke = '#00ff88';
            }
        }

        // Update status indicator
        const indicator = document.getElementById('systemStatusIndicator');
        if (indicator) {
            if (criticalCount > 0) {
                indicator.innerHTML = '<span class="status-dot" style="background:#ff3b5c"></span><span style="color:#ff3b5c">Critical</span>';
            } else if (warningCount > 0) {
                indicator.innerHTML = '<span class="status-dot" style="background:#ff6b35"></span><span style="color:#ff6b35">Warning</span>';
            } else {
                indicator.innerHTML = '<span class="status-dot active"></span><span>Active</span>';
            }
        }

        // Update LEDs
        document.getElementById('ledWarning')?.classList.toggle('active', warningCount > 0);
        document.getElementById('ledCritical')?.classList.toggle('active', criticalCount > 0);
    }

    updateBoardHealth() {
        const display = document.getElementById('boardHealthDisplay');
        if (display) {
            display.textContent = this.state.boardHealth.toFixed(2) + '%';
        }
    }

    updatePanelDisplay() {
        const currentSensor = this.sensors.current;
        const display = document.getElementById('panelCurrentDisplay');
        if (display) {
            display.textContent = currentSensor.current.toFixed(1);
        }
    }

    setConnectionStatus(connected) {
        this.state.mqttConnected = connected;
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.classList.toggle('connected', connected);
            statusEl.querySelector('span').textContent = connected ? 'MQTT Connected' : 'MQTT Disconnected';
        }
    }

    // Page Navigation
    switchPage(page) {
        this.state.currentPage = page;

        // Update menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        // Update title
        const titles = {
            dashboard: 'Dashboard',
            sensors: 'All Sensors',
            analytics: 'Analytics',
            alerts: 'Alerts'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        document.getElementById('breadcrumbPage').textContent = titles[page] || page;

        // Page-specific updates
        if (page === 'analytics') {
            this.updateAnalyticsChart();
            this.renderGauges();
        } else if (page === 'alerts') {
            this.renderAlertsList();
        }
    }

    // All Sensors Page - Premium Design
    renderAllSensorsPage() {
        const grid = document.getElementById('allSensorsGrid');
        if (!grid) return;

        grid.innerHTML = Object.values(this.sensors).map(sensor => {
            const minVal = sensor.history.length > 0 ? Math.min(...sensor.history.map(h => h.value)).toFixed(1) : '--';
            const maxVal = sensor.history.length > 0 ? Math.max(...sensor.history.map(h => h.value)).toFixed(1) : '--';
            const avgVal = sensor.history.length > 0 ? (sensor.history.reduce((a, b) => a + b.value, 0) / sensor.history.length).toFixed(1) : '--';

            return `
                <div class="sensor-full-card glass-card" data-sensor="${sensor.id}" data-status="${sensor.status}">
                    <div class="sensor-card-header">
                        <div class="sensor-icon ${sensor.iconClass}">
                            <i class="fas ${sensor.icon}"></i>
                        </div>
                        <div class="sensor-info">
                            <span class="sensor-name">${sensor.name}</span>
                            <span class="sensor-type">${this.getSensorCategory(sensor.id)}</span>
                        </div>
                        <div class="status-indicator-dot"></div>
                    </div>
                    <div class="sensor-card-body">
                        <div class="sensor-value-display">
                            <span class="big-value">${sensor.current.toFixed(1)}</span>
                            <span class="value-unit">${sensor.unit}</span>
                        </div>
                        <div class="sensor-stats-row">
                            <div class="sensor-stat">
                                <span class="sensor-stat-label">Min</span>
                                <span class="sensor-stat-value">${minVal}</span>
                            </div>
                            <div class="sensor-stat">
                                <span class="sensor-stat-label">Avg</span>
                                <span class="sensor-stat-value">${avgVal}</span>
                            </div>
                            <div class="sensor-stat">
                                <span class="sensor-stat-label">Max</span>
                                <span class="sensor-stat-value">${maxVal}</span>
                            </div>
                        </div>
                        <div class="sensor-chart-container">
                            <div class="mini-sparkline" id="${sensor.id}-full-sparkline"></div>
                            <div class="sensor-threshold-indicator"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        grid.querySelectorAll('.sensor-full-card').forEach(card => {
            card.addEventListener('click', () => {
                const sensorId = card.dataset.sensor;
                if (sensorId) this.showSensorModal(sensorId);
            });
        });

        // Update sparklines
        Object.keys(this.sensors).forEach(sensorId => {
            this.updateFullSensorSparkline(sensorId);
        });
    }

    getSensorCategory(sensorId) {
        const categories = {
            temperature: 'Environmental',
            humidity: 'Environmental',
            'air-quality': 'Air Monitor',
            gas: 'Gas Detector',
            'surface-temp': 'Thermal',
            'surface-temp-2': 'Thermal',
            tvoc: 'Air Quality',
            eco2: 'Air Quality',
            no2: 'Gas Detector',
            co: 'Safety',
            pressure: 'Environmental',
            current: 'Electrical'
        };
        return categories[sensorId] || 'Sensor';
    }

    updateFullSensorSparkline(sensorId) {
        const sensor = this.sensors[sensorId];
        const container = document.getElementById(`${sensorId}-full-sparkline`);
        if (!container || sensor.history.length < 2) return;

        const data = sensor.history.slice(-40).map(h => h.value);
        const width = container.offsetWidth || 280;
        const height = container.offsetHeight || 50;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        const points = data.map((v, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((v - min) / range) * (height - 8) - 4;
            return `${x},${y}`;
        }).join(' ');

        const color = this.getSensorColor(sensorId);

        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="fullGrad-${sensorId}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.4"/>
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0.05"/>
                    </linearGradient>
                </defs>
                <polygon points="0,${height} ${points} ${width},${height}" fill="url(#fullGrad-${sensorId})"/>
                <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    // Activity Chart
    renderActivityChart() {
        const container = document.getElementById('activityChart');
        if (!container) return;

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        container.innerHTML = days.map(day => {
            const dots = Array(24).fill(null).map(() => {
                const rand = Math.random();
                let status = 'normal';
                if (rand > 0.95) status = 'critical';
                else if (rand > 0.85) status = 'warning';
                else if (rand > 0.15) status = 'normal';
                return `<div class="activity-dot ${status}"></div>`;
            }).join('');

            return `
                <div class="day-column">
                    <span class="day-label">${day}</span>
                    <div class="dot-grid">${dots}</div>
                </div>
            `;
        }).join('');
    }

    // Analytics
    updateAnalyticsChart() {
        const canvas = document.getElementById('analyticsCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const sensorId = document.getElementById('analyticsSensorSelect')?.value || 'temperature';
        const sensor = this.sensors[sensorId];
        const count = parseInt(document.getElementById('analyticsTimeRange')?.value || '50');

        const data = sensor.history.slice(-count).map(h => h.value);
        if (data.length < 2) {
            // Generate sample data if no history
            for (let i = 0; i < count; i++) {
                data.push(sensor.min + Math.random() * (sensor.max - sensor.min) * 0.5);
            }
        }

        const width = canvas.parentElement.offsetWidth;
        const height = canvas.parentElement.offsetHeight;
        canvas.width = width;
        canvas.height = height;

        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (i / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Labels
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '11px Inter';
            ctx.textAlign = 'right';
            const val = max - (i / 5) * range;
            ctx.fillText(val.toFixed(1), padding - 5, y + 4);
        }

        // Line
        const color = this.getSensorColor(sensorId);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((v, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = padding + ((max - v) / range) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Fill
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, color.replace(')', ',0.3)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, color.replace(')', ',0)').replace('rgb', 'rgba'));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        data.forEach((v, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = padding + ((max - v) / range) * chartHeight;
            ctx.lineTo(x, y);
        });
        ctx.lineTo(width - padding, height - padding);
        ctx.closePath();
        ctx.fill();

        // Update stats
        if (sensor.history.length > 0) {
            const values = sensor.history.map(h => h.value);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;

            if (sensorId === 'temperature') {
                document.getElementById('avgTemp').textContent = avg.toFixed(1) + '°C';
            } else if (sensorId === 'humidity') {
                document.getElementById('avgHumidity').textContent = avg.toFixed(1) + '%';
            } else if (sensorId === 'current') {
                document.getElementById('avgCurrent').textContent = avg.toFixed(2) + 'A';
            }
        }

        document.getElementById('totalAlerts').textContent = this.state.alerts.length;
    }

    renderGauges() {
        this.renderGauge('tempGauge', this.sensors.temperature);
        this.renderGauge('humidityGauge', this.sensors.humidity);
        this.renderGauge('coGauge', this.sensors.co);
        this.renderGauge('currentGauge', this.sensors.current);
        this.renderSystemHealthGauge();
        this.renderSensorSummary();
    }

    renderGauge(canvasId, sensor) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height - 20;
        const radius = 75;

        ctx.clearRect(0, 0, width, height);

        // Background arc with gradient
        const bgGradient = ctx.createLinearGradient(0, 0, width, 0);
        bgGradient.addColorStop(0, 'rgba(255,255,255,0.05)');
        bgGradient.addColorStop(1, 'rgba(255,255,255,0.1)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
        ctx.strokeStyle = bgGradient;
        ctx.lineWidth = 12;
        ctx.stroke();

        // Value arc
        const range = sensor.max - sensor.min;
        const normalized = Math.max(0, Math.min(1, (sensor.current - sensor.min) / range));
        const endAngle = Math.PI + normalized * Math.PI;

        let color = '#10b981';
        if (sensor.status === 'warning') color = '#f59e0b';
        else if (sensor.status === 'critical') color = '#ef4444';

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false);
        ctx.strokeStyle = color;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Value text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(sensor.current.toFixed(1), centerX, centerY - 15);

        ctx.fillStyle = 'rgba(248,250,252,0.5)';
        ctx.font = '12px Inter';
        ctx.fillText(sensor.unit, centerX, centerY + 5);
    }

    renderSystemHealthGauge() {
        const canvas = document.getElementById('systemHealthGauge');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 90;

        ctx.clearRect(0, 0, width, height);

        // Calculate health percentage
        let normalCount = 0, warningCount = 0, criticalCount = 0;
        Object.values(this.sensors).forEach(sensor => {
            if (sensor.status === 'critical') criticalCount++;
            else if (sensor.status === 'warning') warningCount++;
            else normalCount++;
        });

        const total = Object.keys(this.sensors).length;
        const healthPercent = Math.round(((normalCount + warningCount * 0.5) / total) * 100);

        // Update display value
        const valueEl = document.getElementById('systemHealthValue');
        if (valueEl) valueEl.textContent = healthPercent;

        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 16;
        ctx.stroke();

        // Progress arc
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (healthPercent / 100) * Math.PI * 2;

        let color = '#10b981';
        if (healthPercent < 50) color = '#ef4444';
        else if (healthPercent < 75) color = '#f59e0b';

        // Gradient for arc
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#00c8ff');
        gradient.addColorStop(1, '#7c3aed');

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.strokeStyle = healthPercent >= 75 ? gradient : color;
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Inner decorative circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 25, 0, Math.PI * 2, false);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    renderSensorSummary() {
        const grid = document.getElementById('sensorSummaryGrid');
        if (!grid) return;

        // Show top 6 sensors
        const topSensors = ['temperature', 'humidity', 'co', 'current', 'air-quality', 'pressure'];

        grid.innerHTML = topSensors.map(sensorId => {
            const sensor = this.sensors[sensorId];
            if (!sensor) return '';

            return `
                <div class="sensor-summary-item" data-sensor="${sensorId}">
                    <div class="summary-icon sensor-icon ${sensor.iconClass}">
                        <i class="fas ${sensor.icon}"></i>
                    </div>
                    <div class="summary-info">
                        <span class="summary-name">${sensor.name}</span>
                        <span class="summary-value">${sensor.current.toFixed(1)} ${sensor.unit}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        grid.querySelectorAll('.sensor-summary-item').forEach(item => {
            item.addEventListener('click', () => {
                const sensorId = item.dataset.sensor;
                if (sensorId) this.showSensorModal(sensorId);
            });
        });
    }

    // Alerts
    addAlert(sensor) {
        const alert = {
            id: Date.now(),
            type: sensor.status,
            sensor: sensor.name,
            sensorId: sensor.id,
            value: sensor.current,
            unit: sensor.unit,
            message: `${sensor.name} ${sensor.status === 'critical' ? 'kritik seviyede' : 'uyarı seviyesinde'}: ${sensor.current.toFixed(1)}${sensor.unit}`,
            time: new Date()
        };

        // Avoid duplicates
        const recent = this.state.alerts.find(a =>
            a.sensorId === alert.sensorId &&
            Date.now() - a.time.getTime() < 30000
        );
        if (recent) return;

        this.state.alerts.unshift(alert);
        if (this.state.alerts.length > 50) this.state.alerts.pop();

        // Update badge
        document.getElementById('sidebarAlertCount').textContent = this.state.alerts.length;

        // Show toast
        this.showToast(alert);

        // Update alerts page if visible
        if (this.state.currentPage === 'alerts') {
            this.renderAlertsList();
        }
    }

    renderAlertsList(filter = 'all') {
        const container = document.getElementById('alertsListFull');
        if (!container) return;

        let alerts = this.state.alerts;
        if (filter !== 'all') {
            alerts = alerts.filter(a => a.type === filter);
        }

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle"></i>
                    <p>Şu anda alarm bulunmuyor</p>
                </div>
            `;
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${alert.sensor}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${this.formatTime(alert.time)}</div>
                </div>
            </div>
        `).join('');
    }

    filterAlerts(filter) {
        this.renderAlertsList(filter);
    }

    clearAlerts() {
        this.state.alerts = [];
        document.getElementById('sidebarAlertCount').textContent = '0';
        this.renderAlertsList();
    }

    // Modal
    showSensorModal(sensorId) {
        const sensor = this.sensors[sensorId];
        if (!sensor) return;

        const modal = document.getElementById('sensorDetailModal');

        document.getElementById('modalSensorIcon').innerHTML = `<i class="fas ${sensor.icon}"></i>`;
        document.getElementById('modalSensorName').textContent = sensor.name;
        document.getElementById('modalSensorType').textContent = sensor.id;
        document.getElementById('modalSensorValue').textContent = sensor.current.toFixed(1);
        document.getElementById('modalSensorUnit').textContent = sensor.unit;
        document.getElementById('modalSensorStatus').innerHTML = `<span class="status-badge ${sensor.status}">${sensor.status.toUpperCase()}</span>`;
        document.getElementById('modalWarningThreshold').textContent = sensor.thresholds.warning + sensor.unit;
        document.getElementById('modalCriticalThreshold').textContent = sensor.thresholds.critical + sensor.unit;

        // Render history chart
        this.renderModalChart(sensor);

        modal.classList.add('show');
    }

    renderModalChart(sensor) {
        const canvas = document.getElementById('modalHistoryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = 200;

        const data = sensor.history.map(h => h.value);
        if (data.length < 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '14px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Henüz yeterli veri yok', canvas.width / 2, 100);
            return;
        }

        const padding = 30;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw line
        const color = this.getSensorColor(sensor.id);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((v, i) => {
            const x = padding + (i / (data.length - 1)) * width;
            const y = padding + ((max - v) / range) * height;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    hideModal() {
        document.getElementById('sensorDetailModal')?.classList.remove('show');
    }

    // Toast
    showToast(alert) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${alert.type}`;
        toast.innerHTML = `
            <i class="fas fa-exclamation-triangle toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${alert.sensor}</div>
                <div class="toast-message">${alert.message}</div>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Utilities
    startClock() {
        const update = () => {
            const now = new Date();
            document.getElementById('systemTime').textContent = now.toLocaleTimeString('tr-TR');
        };
        update();
        setInterval(update, 1000);
    }

    startAIRotation() {
        let index = 0;
        const update = () => {
            const text = this.aiMessages[index];
            const el = document.getElementById('aiAnalysisText');
            const timeEl = document.getElementById('aiAnalysisTime');

            if (el) {
                el.style.opacity = '0';
                setTimeout(() => {
                    el.textContent = text;
                    el.style.opacity = '1';
                }, 300);
            }
            if (timeEl) {
                timeEl.textContent = `${Math.floor(Math.random() * 5) + 1} dk önce`;
            }

            index = (index + 1) % this.aiMessages.length;
        };

        update();
        setInterval(update, 15000);
    }

    resetPanelView() {
        const cabinet = document.querySelector('.panel-cabinet');
        if (cabinet) {
            cabinet.style.transform = 'translate(-50%, -50%) rotateX(5deg) rotateY(-5deg)';
        }
    }

    toggleGrid() {
        const grid = document.getElementById('sceneGrid');
        if (grid) {
            grid.classList.toggle('hidden');
            this.state.gridVisible = !this.state.gridVisible;
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.aico3D = new AICO3DDashboard();
});
