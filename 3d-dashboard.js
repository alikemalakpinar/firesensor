/**
 * AICO 3D Fire Detection Dashboard
 * Sanded Glass Effect Theme with MQTT Integration
 */

class Dashboard3D {
    constructor() {
        this.sensors = {
            temperature: {
                id: 'temperature',
                name: 'Temperature',
                unit: '°C',
                current: 25.0,
                min: 22,
                max: 28,
                history: [],
                status: 'normal',
                thresholds: { warning: 35, critical: 45 },
                color: '#ff7043'
            },
            humidity: {
                id: 'humidity',
                name: 'Humidity',
                unit: '%',
                current: 45.0,
                min: 40,
                max: 55,
                history: [],
                status: 'normal',
                thresholds: { warning: 30, critical: 80 },
                color: '#42a5f5'
            },
            'air-quality': {
                id: 'air-quality',
                name: 'Air Quality',
                unit: 'AQI',
                current: 35.0,
                min: 28,
                max: 52,
                history: [],
                status: 'normal',
                thresholds: { warning: 50, critical: 100 },
                color: '#26a69a'
            },
            gas: {
                id: 'gas',
                name: 'Gas Detection',
                unit: 'ppm',
                current: 65.0,
                min: 45,
                max: 89,
                history: [],
                status: 'normal',
                thresholds: { warning: 300, critical: 500 },
                color: '#ab47bc'
            },
            'surface-temp': {
                id: 'surface-temp',
                name: 'Surface Temp',
                unit: '°C',
                current: 28.0,
                min: 25,
                max: 35,
                history: [],
                status: 'normal',
                thresholds: { warning: 60, critical: 80 },
                color: '#8a2be2'
            },
            'surface-temp-2': {
                id: 'surface-temp-2',
                name: 'Surface Temp 2',
                unit: '°C',
                current: 27.5,
                min: 24,
                max: 34,
                history: [],
                status: 'normal',
                thresholds: { warning: 60, critical: 80 },
                color: '#8a2be2'
            },
            tvoc: {
                id: 'tvoc',
                name: 'TVOC',
                unit: 'ppb',
                current: 350,
                min: 200,
                max: 500,
                history: [],
                status: 'normal',
                thresholds: { warning: 660, critical: 2200 },
                color: '#34d399'
            },
            eco2: {
                id: 'eco2',
                name: 'eCO2',
                unit: 'ppm',
                current: 450,
                min: 400,
                max: 600,
                history: [],
                status: 'normal',
                thresholds: { warning: 1000, critical: 2000 },
                color: '#fbbf24'
            },
            no2: {
                id: 'no2',
                name: 'NO2',
                unit: 'ppb',
                current: 20,
                min: 15,
                max: 30,
                history: [],
                status: 'normal',
                thresholds: { warning: 50, critical: 100 },
                color: '#a855f7'
            },
            co: {
                id: 'co',
                name: 'CO',
                unit: 'ppm',
                current: 5,
                min: 0,
                max: 10,
                history: [],
                status: 'normal',
                thresholds: { warning: 25, critical: 50 },
                color: '#f87171'
            },
            pressure: {
                id: 'pressure',
                name: 'Pressure',
                unit: 'hPa',
                current: 1013,
                min: 1010,
                max: 1020,
                history: [],
                status: 'normal',
                thresholds: { warning: 1000, critical: 1050 },
                color: '#6c757d'
            },
            current: {
                id: 'current',
                name: 'Current',
                unit: 'A',
                current: 2.5,
                min: 1.5,
                max: 3.5,
                history: [],
                status: 'normal',
                thresholds: { warning: 5, critical: 8 },
                color: '#ffc107'
            }
        };

        this.systemState = {
            isProtectionActive: true,
            systemHealth: 87,
            activeSensors: 12,
            totalSensors: 14,
            alerts: [],
            weeklyActivity: []
        };

        this.aiTips = [
            "All sensors operating within normal parameters. No fire risk detected.",
            "Humidity levels slightly elevated. Monitor ventilation systems.",
            "Temperature stable across all zones. Fire suppression systems ready.",
            "Air quality excellent. HVAC systems functioning optimally.",
            "All detection circuits tested and operational.",
            "Periodic sensor calibration recommended within 30 days."
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateWeeklyActivity();
        this.renderDotChart();
        this.renderMiniCharts();
        this.updateSystemStats();
        this.startAnimations();
        this.rotateTips();

        // Connect to existing MQTT system if available
        if (window.mqttClient) {
            this.integrateWithMQTT();
        }

        console.log('AICO 3D Dashboard initialized');
    }

    setupEventListeners() {
        // Protection toggle
        const protectionToggle = document.getElementById('protectionToggle');
        if (protectionToggle) {
            protectionToggle.addEventListener('change', (e) => {
                this.systemState.isProtectionActive = e.target.checked;
                this.updateProtectionStatus();
            });
        }

        // More details button
        const moreDetailsBtn = document.getElementById('moreDetailsBtn');
        if (moreDetailsBtn) {
            moreDetailsBtn.addEventListener('click', () => this.showSensorsModal());
        }

        // Modal close
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideSensorsModal());
        }

        // Modal backdrop click
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.hideSensorsModal());
        }

        // Location tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.changeLocation(e.target.dataset.location);
            });
        });

        // Week navigation
        const prevWeek = document.getElementById('prevWeek');
        const nextWeek = document.getElementById('nextWeek');
        if (prevWeek) prevWeek.addEventListener('click', () => this.navigateWeek(-1));
        if (nextWeek) nextWeek.addEventListener('click', () => this.navigateWeek(1));

        // Sensor card clicks
        document.querySelectorAll('.sensor-card').forEach(card => {
            card.addEventListener('click', () => {
                const sensorId = card.dataset.sensor;
                this.showSensorDetail(sensorId);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSensorsModal();
            }
        });

        // 3D room interaction
        const room3d = document.querySelector('.room-3d');
        if (room3d) {
            room3d.addEventListener('mousemove', (e) => {
                const rect = room3d.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                room3d.style.transform = `rotateX(${60 + y * 10}deg) rotateZ(${-45 + x * 10}deg)`;
            });

            room3d.addEventListener('mouseleave', () => {
                room3d.style.transform = 'rotateX(60deg) rotateZ(-45deg)';
            });
        }

        // Sensor points in 3D room
        document.querySelectorAll('.sensor-point').forEach(point => {
            point.addEventListener('click', (e) => {
                e.stopPropagation();
                const sensorId = point.dataset.sensor;
                this.highlightSensor(sensorId);
            });
        });
    }

    integrateWithMQTT() {
        // Override the MQTT client's update function to also update this dashboard
        const originalUpdate = window.mqttClient.updateDashboardSensors;

        window.mqttClient.updateDashboardSensors = (sensorData) => {
            // Call original function if it exists
            if (originalUpdate) {
                originalUpdate.call(window.mqttClient, sensorData);
            }

            // Update 3D dashboard
            this.updateFromMQTT(sensorData);
        };
    }

    updateFromMQTT(sensorData) {
        Object.keys(sensorData).forEach(sensorId => {
            if (this.sensors[sensorId]) {
                const value = sensorData[sensorId];
                this.updateSensorValue(sensorId, value);
            }
        });

        this.updateSystemStats();
        this.checkForAlerts();
    }

    updateSensorValue(sensorId, value) {
        const sensor = this.sensors[sensorId];
        if (!sensor) return;

        // Update history
        sensor.history.push(value);
        if (sensor.history.length > 50) {
            sensor.history.shift();
        }

        sensor.current = value;

        // Calculate min/max from recent history
        if (sensor.history.length > 0) {
            sensor.min = Math.min(...sensor.history.slice(-20));
            sensor.max = Math.max(...sensor.history.slice(-20));
        }

        // Update status
        if (value >= sensor.thresholds.critical) {
            sensor.status = 'critical';
        } else if (value >= sensor.thresholds.warning) {
            sensor.status = 'warning';
        } else {
            sensor.status = 'normal';
        }

        // Update UI elements
        this.updateSensorUI(sensorId);
    }

    updateSensorUI(sensorId) {
        const sensor = this.sensors[sensorId];

        // Update main display cards
        if (sensorId === 'temperature') {
            this.updateElement('tempMin', Math.round(sensor.min));
            this.updateElement('tempMax', Math.round(sensor.max));
        } else if (sensorId === 'gas') {
            this.updateElement('gasMin', Math.round(sensor.min));
            this.updateElement('gasMax', Math.round(sensor.max));
        } else if (sensorId === 'air-quality') {
            this.updateElement('airMin', Math.round(sensor.min));
            this.updateElement('airMax', Math.round(sensor.max));
        }

        // Update 3D room sensor points
        const sensorPoint = document.querySelector(`.sensor-point[data-sensor="${sensorId}"]`);
        if (sensorPoint) {
            const dot = sensorPoint.querySelector('.sensor-dot');
            const pulse = sensorPoint.querySelector('.sensor-pulse');

            dot.style.background = this.getStatusColor(sensor.status);
            dot.style.boxShadow = `0 0 15px ${this.getStatusColor(sensor.status)}`;
            pulse.style.borderColor = this.getStatusColor(sensor.status);
        }

        // Update mini chart
        this.renderMiniChart(sensorId);
    }

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    }

    getStatusColor(status) {
        const colors = {
            normal: '#7cb342',
            warning: '#ffb300',
            critical: '#ef5350'
        };
        return colors[status] || colors.normal;
    }

    updateSystemStats() {
        // Calculate system health based on sensor statuses
        let healthScore = 100;
        let criticalCount = 0;
        let warningCount = 0;

        Object.values(this.sensors).forEach(sensor => {
            if (sensor.status === 'critical') {
                healthScore -= 15;
                criticalCount++;
            } else if (sensor.status === 'warning') {
                healthScore -= 5;
                warningCount++;
            }
        });

        this.systemState.systemHealth = Math.max(0, healthScore);
        this.systemState.alerts = [];

        // Add alerts
        Object.values(this.sensors).forEach(sensor => {
            if (sensor.status === 'critical') {
                this.systemState.alerts.push({
                    type: 'critical',
                    sensor: sensor.name,
                    message: `${sensor.name} at critical level: ${sensor.current}${sensor.unit}`,
                    time: new Date()
                });
            } else if (sensor.status === 'warning') {
                this.systemState.alerts.push({
                    type: 'warning',
                    sensor: sensor.name,
                    message: `${sensor.name} above warning threshold: ${sensor.current}${sensor.unit}`,
                    time: new Date()
                });
            }
        });

        // Update UI
        this.updateElement('systemHealthValue', `${this.systemState.systemHealth}%`);
        this.updateElement('activeSensors', this.systemState.activeSensors);
        this.updateElement('totalSensors', this.systemState.totalSensors);
        this.updateElement('alertCount', this.systemState.alerts.length);

        // Update health ring
        const ring = document.getElementById('healthRing');
        if (ring) {
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (this.systemState.systemHealth / 100) * circumference;
            ring.style.strokeDashoffset = offset;

            // Change color based on health
            if (this.systemState.systemHealth < 50) {
                ring.style.stroke = '#ef5350';
            } else if (this.systemState.systemHealth < 75) {
                ring.style.stroke = '#ffb300';
            } else {
                ring.style.stroke = '#7cb342';
            }
        }

        // Update alerts panel
        this.renderAlerts();
    }

    renderAlerts() {
        const alertsList = document.getElementById('alertsList');
        const alertsPanel = document.getElementById('alertsPanel');

        if (!alertsList || !alertsPanel) return;

        if (this.systemState.alerts.length > 0) {
            alertsPanel.classList.add('show');

            alertsList.innerHTML = this.systemState.alerts.map(alert => `
                <div class="alert-item ${alert.type}">
                    <i class="fas fa-exclamation-triangle alert-icon"></i>
                    <div class="alert-content">
                        <div class="alert-title">${alert.sensor}</div>
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-time">${this.formatTime(alert.time)}</div>
                    </div>
                </div>
            `).join('');
        } else {
            alertsPanel.classList.remove('show');
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    generateWeeklyActivity() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        this.systemState.weeklyActivity = days.map(day => ({
            day,
            data: Array(24).fill(null).map(() => {
                const rand = Math.random();
                if (rand < 0.85) return 'normal';
                if (rand < 0.95) return 'warning';
                return 'critical';
            })
        }));
    }

    renderDotChart() {
        const dotChart = document.getElementById('dotChart');
        if (!dotChart) return;

        dotChart.innerHTML = this.systemState.weeklyActivity.map(dayData => `
            <div class="day-column">
                <span class="day-label">${dayData.day}</span>
                <div class="dot-grid">
                    ${dayData.data.map(status => `
                        <div class="activity-dot ${status}"></div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    renderMiniCharts() {
        ['temperature', 'gas', 'air-quality'].forEach(sensorId => {
            this.renderMiniChart(sensorId);
        });
    }

    renderMiniChart(sensorId) {
        const chartId = {
            'temperature': 'tempMiniChart',
            'gas': 'gasMiniChart',
            'air-quality': 'airMiniChart'
        }[sensorId];

        const container = document.getElementById(chartId);
        if (!container) return;

        const sensor = this.sensors[sensorId];
        const data = sensor.history.length > 0 ? sensor.history : this.generateFakeHistory(20);

        // Create SVG mini chart
        const width = container.offsetWidth || 200;
        const height = container.offsetHeight || 40;

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;

        const points = data.map((value, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((value - min) / range) * (height - 4) - 2;
            return `${x},${y}`;
        }).join(' ');

        const fillPoints = `0,${height} ${points} ${width},${height}`;

        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="grad-${sensorId}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${sensor.color};stop-opacity:0.4"/>
                        <stop offset="100%" style="stop-color:${sensor.color};stop-opacity:0"/>
                    </linearGradient>
                </defs>
                <polygon points="${fillPoints}" fill="url(#grad-${sensorId})"/>
                <polyline points="${points}" fill="none" stroke="${sensor.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
    }

    generateFakeHistory(count) {
        const history = [];
        let value = 50;
        for (let i = 0; i < count; i++) {
            value += (Math.random() - 0.5) * 10;
            value = Math.max(20, Math.min(80, value));
            history.push(value);
        }
        return history;
    }

    showSensorsModal() {
        const modal = document.getElementById('sensorsModal');
        const grid = document.getElementById('allSensorsGrid');

        if (!modal || !grid) return;

        // Generate all sensor cards
        grid.innerHTML = Object.values(this.sensors).map(sensor => `
            <div class="stat-card sanded-glass sensor-card" data-sensor="${sensor.id}">
                <div class="sensor-card-header">
                    <div class="sensor-icon" style="background: linear-gradient(135deg, ${sensor.color}, ${this.darkenColor(sensor.color, 20)})">
                        <i class="fas ${this.getSensorIcon(sensor.id)}"></i>
                    </div>
                    <div class="stat-label">${sensor.name}</div>
                </div>
                <div class="stat-value-range">
                    <span class="value-main">${sensor.current.toFixed(1)}</span>
                    <span class="value-secondary">${sensor.unit}</span>
                </div>
                <div class="sensor-status-badge ${sensor.status}">${sensor.status.toUpperCase()}</div>
            </div>
        `).join('');

        modal.classList.add('show');
    }

    hideSensorsModal() {
        const modal = document.getElementById('sensorsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    getSensorIcon(sensorId) {
        const icons = {
            'temperature': 'fa-thermometer-half',
            'humidity': 'fa-droplet',
            'air-quality': 'fa-wind',
            'gas': 'fa-smog',
            'surface-temp': 'fa-temperature-high',
            'surface-temp-2': 'fa-temperature-high',
            'tvoc': 'fa-atom',
            'eco2': 'fa-leaf',
            'no2': 'fa-cloud',
            'co': 'fa-skull-crossbones',
            'pressure': 'fa-gauge-high',
            'current': 'fa-bolt'
        };
        return icons[sensorId] || 'fa-sensor';
    }

    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }

    highlightSensor(sensorId) {
        // Highlight sensor point in 3D room
        document.querySelectorAll('.sensor-point').forEach(point => {
            point.classList.remove('highlighted');
        });

        const point = document.querySelector(`.sensor-point[data-sensor="${sensorId}"]`);
        if (point) {
            point.classList.add('highlighted');

            // Also highlight corresponding card
            document.querySelectorAll('.sensor-card').forEach(card => {
                card.classList.remove('highlighted');
                if (card.dataset.sensor === sensorId) {
                    card.classList.add('highlighted');
                }
            });
        }
    }

    showSensorDetail(sensorId) {
        // If original dashboard has this function, use it
        if (window.modernFireDashboard && typeof window.modernFireDashboard.showSensorDetail === 'function') {
            window.modernFireDashboard.showSensorDetail(sensorId);
        } else {
            console.log(`Show detail for sensor: ${sensorId}`);
            this.highlightSensor(sensorId);
        }
    }

    changeLocation(location) {
        console.log(`Changing to location: ${location}`);
        // Add location-specific logic here
    }

    navigateWeek(direction) {
        // Regenerate activity data for demo
        this.generateWeeklyActivity();
        this.renderDotChart();
    }

    updateProtectionStatus() {
        const status = this.systemState.isProtectionActive;
        console.log(`Fire protection ${status ? 'activated' : 'deactivated'}`);

        // Update 3D room visual feedback
        const room = document.querySelector('.room-3d');
        if (room) {
            if (status) {
                room.classList.remove('protection-off');
            } else {
                room.classList.add('protection-off');
            }
        }
    }

    rotateTips() {
        let tipIndex = 0;
        const tipElement = document.getElementById('aiTipText');
        const timeElement = document.getElementById('analysisTime');

        setInterval(() => {
            tipIndex = (tipIndex + 1) % this.aiTips.length;
            if (tipElement) {
                tipElement.style.opacity = '0';
                setTimeout(() => {
                    tipElement.textContent = this.aiTips[tipIndex];
                    tipElement.style.opacity = '1';
                }, 300);
            }
            if (timeElement) {
                timeElement.textContent = `${Math.floor(Math.random() * 5) + 1} min`;
            }
        }, 10000);
    }

    startAnimations() {
        // Animate sensor values periodically for demo
        setInterval(() => {
            if (!window.mqttClient || !window.mqttClient.connected) {
                // Only simulate if not receiving real MQTT data
                this.simulateSensorUpdates();
            }
        }, 3000);
    }

    simulateSensorUpdates() {
        Object.keys(this.sensors).forEach(sensorId => {
            const sensor = this.sensors[sensorId];
            const variation = (Math.random() - 0.5) * 5;
            const newValue = Math.max(sensor.min, Math.min(sensor.max, sensor.current + variation));
            this.updateSensorValue(sensorId, newValue);
        });
    }

    checkForAlerts() {
        // Check for critical conditions
        Object.values(this.sensors).forEach(sensor => {
            if (sensor.status === 'critical') {
                this.triggerAlert(sensor);
            }
        });
    }

    triggerAlert(sensor) {
        console.log(`ALERT: ${sensor.name} at critical level!`);

        // Flash the 3D room red briefly
        const room = document.querySelector('.room-floor');
        if (room) {
            room.style.boxShadow = '0 50px 100px rgba(239, 83, 80, 0.5), inset 0 0 50px rgba(239, 83, 80, 0.2)';
            setTimeout(() => {
                room.style.boxShadow = '';
            }, 500);
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard3D = new Dashboard3D();

    // Expose global API
    window.AICO3D = {
        dashboard: window.dashboard3D,
        version: '1.0.0',
        theme: 'sanded-glass'
    };
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard3D;
}
