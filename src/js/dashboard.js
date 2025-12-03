class AICO3DDashboard {
    constructor() {
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
            gridVisible: true,
            selectedDevice: 0,
            selectedSensor: 'temperature'
        };
        this.devices = [
            { id: 0, name: 'AICO Panel #1', location: 'Ana Pano', online: true, health: 100, sensors: this.cloneSensors() },
            { id: 1, name: 'AICO Panel #2', location: 'Yedek Pano', online: true, health: 100, sensors: this.cloneSensors() },
            { id: 2, name: 'AICO Panel #3', location: 'Dış Pano', online: true, health: 100, sensors: this.cloneSensors() }
        ];
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
    cloneSensors() {
        const clone = {};
        Object.keys(this.sensors).forEach(key => {
            clone[key] = { ...this.sensors[key], history: [], current: 0, status: 'normal' };
        });
        return clone;
    }
    init() {
        this.setupEventListeners();
        this.startClock();
        this.renderActivityChart();
        this.renderAllSensorsPage();
        this.connectMQTT();
        this.startAIRotation();
        this.updateDeviceOverview();
        this.startDemoData(); 
        console.log('AICO 3D Dashboard initialized');
    }
    startDemoData() {
        setInterval(() => {
            this.devices.forEach((device, index) => {
                const baseTemp = 22 + index * 2 + (Math.random() - 0.5) * 3;
                const baseHumidity = 45 + index * 5 + (Math.random() - 0.5) * 5;
                const baseCurrent = 2 + index * 0.5 + (Math.random() - 0.5) * 0.5;
                const baseCO = 5 + index * 2 + Math.random() * 3;
                this.updateDeviceSensor(index, 'temperature', baseTemp);
                this.updateDeviceSensor(index, 'humidity', baseHumidity);
                this.updateDeviceSensor(index, 'current', baseCurrent);
                this.updateDeviceSensor(index, 'co', baseCO);
                this.updateDeviceSensor(index, 'pressure', 1013 + Math.random() * 10);
                this.updateDeviceSensor(index, 'air-quality', 30 + Math.random() * 20);
            });
            this.updateDeviceOverview();
            this.updateEnergyFlow();
            this.updateDashboardSummary();
            if (this.state.currentPage === 'analytics') {
                this.updateAnalyticsChart();
                this.updateMainGauge();
                this.renderMiniGauges();
            }
        }, 2000);
    }
    updateDeviceSensor(deviceIndex, sensorId, value) {
        const device = this.devices[deviceIndex];
        if (!device || !device.sensors[sensorId]) return;
        const sensor = device.sensors[sensorId];
        sensor.current = value;
        sensor.history.push({ value, time: new Date() });
        if (sensor.history.length > 100) sensor.history.shift();
        if (value >= sensor.thresholds.critical) {
            sensor.status = 'critical';
        } else if (value >= sensor.thresholds.warning) {
            sensor.status = 'warning';
        } else {
            sensor.status = 'normal';
        }
        if (deviceIndex === this.state.selectedDevice) {
            this.sensors[sensorId] = { ...this.sensors[sensorId], ...sensor };
            this.updateSensorUI(sensorId);
        }
    }
    setupEventListeners() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.switchPage(page);
            });
        });
        document.querySelectorAll('.sensor-metric, .sensor-full-card').forEach(card => {
            card.addEventListener('click', () => {
                const sensorId = card.dataset.sensor;
                if (sensorId) this.showSensorModal(sensorId);
            });
        });
        document.querySelectorAll('.panel-sensor').forEach(sensor => {
            sensor.addEventListener('click', () => {
                const sensorId = sensor.dataset.sensor;
                if (sensorId) this.showSensorModal(sensorId);
            });
        });
        document.getElementById('closeDetailModal')?.addEventListener('click', () => this.hideModal());
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => this.hideModal());
        document.getElementById('resetView')?.addEventListener('click', () => this.resetPanelView());
        document.getElementById('toggleGrid')?.addEventListener('click', () => this.toggleGrid());
        document.getElementById('prevWeekBtn')?.addEventListener('click', () => this.renderActivityChart());
        document.getElementById('nextWeekBtn')?.addEventListener('click', () => this.renderActivityChart());
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterAlerts(e.target.dataset.filter);
            });
        });
        document.getElementById('clearAlerts')?.addEventListener('click', () => this.clearAlerts());
        document.getElementById('analyticsSensorSelect')?.addEventListener('change', () => this.updateAnalyticsChart());
        document.getElementById('analyticsTimeRange')?.addEventListener('change', () => this.updateAnalyticsChart());
        document.querySelectorAll('#page-sensors .device-tab, #page-analytics .device-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const device = e.currentTarget.dataset.device;
                const container = e.currentTarget.closest('.device-selector');
                if (device === 'all') {
                    this.state.selectedDevice = 'all';
                } else {
                    this.selectDevice(parseInt(device));
                }
                container.querySelectorAll('.device-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        document.querySelectorAll('#dashboardDeviceSelector .device-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const device = parseInt(e.currentTarget.dataset.device);
                this.selectDevice(device);
                document.querySelectorAll('#dashboardDeviceSelector .device-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateDashboardForDevice(device);
            });
        });
        document.querySelectorAll('.device-overview-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const device = parseInt(e.currentTarget.dataset.device);
                this.selectDevice(device);
            });
        });
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const view = e.currentTarget.dataset.view;
                const grid = document.getElementById('allSensorsGrid');
                if (grid) {
                    grid.classList.toggle('list-view', view === 'list');
                }
            });
        });
        document.querySelectorAll('.sensor-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.sensor-chip').forEach(c => c.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.state.selectedSensor = e.currentTarget.dataset.sensor;
                this.updateAnalyticsChart();
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideModal();
        });
    }
    selectDevice(deviceIndex) {
        this.state.selectedDevice = deviceIndex;
        document.querySelectorAll('.device-overview-card').forEach(card => {
            card.classList.toggle('active', parseInt(card.dataset.device) === deviceIndex);
        });
        const device = this.devices[deviceIndex];
        if (device) {
            Object.keys(device.sensors).forEach(sensorId => {
                this.sensors[sensorId] = { ...this.sensors[sensorId], ...device.sensors[sensorId] };
            });
        }
        this.renderAllSensorsPage();
        this.updateSystemStatus();
    }
    updateDashboardForDevice(deviceIndex) {
        const device = this.devices[deviceIndex];
        if (!device) return;
        Object.keys(device.sensors).forEach(sensorId => {
            this.sensors[sensorId] = { ...this.sensors[sensorId], ...device.sensors[sensorId] };
            this.updateSensorUI(sensorId);
            this.updateSensorSparkline(sensorId);
        });
        this.updateSystemStatus();
        this.updatePanelDisplay();
    }
    updateDashboardSummary() {
        let totalPower = 0;
        let totalTemp = 0;
        this.devices.forEach(device => {
            totalPower += device.sensors.current.current * 220;
            totalTemp += device.sensors.temperature.current;
        });
        const avgTemp = totalTemp / this.devices.length;
        const powerEl = document.getElementById('dashTotalPower');
        if (powerEl) powerEl.textContent = (totalPower / 1000).toFixed(2) + ' kW';
        const tempEl = document.getElementById('dashAvgTemp');
        if (tempEl) tempEl.textContent = avgTemp.toFixed(1) + '°C';
    }
    updateDeviceOverview() {
        this.devices.forEach((device, index) => {
            let normalCount = 0, warningCount = 0, criticalCount = 0;
            Object.values(device.sensors).forEach(sensor => {
                if (sensor.status === 'critical') criticalCount++;
                else if (sensor.status === 'warning') warningCount++;
                else normalCount++;
            });
            const total = Object.keys(device.sensors).length;
            device.health = Math.round(((normalCount + warningCount * 0.5) / total) * 100);
            const healthEl = document.getElementById(`device${index}Health`);
            if (healthEl) healthEl.textContent = device.health + '%';
            const tempEl = document.getElementById(`device${index}Temp`);
            if (tempEl) tempEl.textContent = device.sensors.temperature.current.toFixed(1) + '°C';
            const humidityEl = document.getElementById(`device${index}Humidity`);
            if (humidityEl) humidityEl.textContent = device.sensors.humidity.current.toFixed(0) + '%';
            const currentEl = document.getElementById(`device${index}Current`);
            if (currentEl) currentEl.textContent = device.sensors.current.current.toFixed(1) + 'A';
            const ringProgress = document.querySelector(`.ring-progress[data-device="${index}"]`);
            if (ringProgress) {
                const circumference = 94.2;
                const offset = circumference - (device.health / 100) * circumference;
                ringProgress.style.strokeDashoffset = offset;
                if (criticalCount > 0) {
                    ringProgress.style.stroke = '#ef4444';
                } else if (warningCount > 0) {
                    ringProgress.style.stroke = '#f59e0b';
                } else {
                    ringProgress.style.stroke = '#10b981';
                }
            }
        });
    }
    updateEnergyFlow() {
        let totalPower = 0;
        this.devices.forEach((device, index) => {
            const current = device.sensors.current.current;
            const power = current * 220; 
            totalPower += power;
            const currentEl = document.getElementById(`flowDevice${index}Current`);
            if (currentEl) currentEl.textContent = current.toFixed(1) + 'A';
            const powerEl = document.getElementById(`flowDevice${index}Power`);
            if (powerEl) powerEl.textContent = Math.round(power) + 'W';
            const statusEl = document.getElementById(`status${index}`);
            if (statusEl) {
                statusEl.classList.remove('normal', 'warning', 'critical');
                let status = 'normal';
                Object.values(device.sensors).forEach(sensor => {
                    if (sensor.status === 'critical') status = 'critical';
                    else if (sensor.status === 'warning' && status !== 'critical') status = 'warning';
                });
                statusEl.classList.add(status);
            }
        });
        const totalPowerEl = document.getElementById('totalPower');
        if (totalPowerEl) totalPowerEl.textContent = (totalPower / 1000).toFixed(2);
        const device = this.devices[0];
        const tempBar = document.getElementById('tempBar0');
        if (tempBar) {
            const tempPercent = Math.min(100, (device.sensors.temperature.current - 15) / (60 - 15) * 100);
            tempBar.setAttribute('width', tempPercent * 2);
        }
        const humidityBar = document.getElementById('humidityBar0');
        if (humidityBar) {
            const humidityPercent = Math.min(100, device.sensors.humidity.current);
            humidityBar.setAttribute('width', humidityPercent * 2);
        }
        const coBar = document.getElementById('coBar0');
        if (coBar) {
            const coPercent = Math.min(100, device.sensors.co.current / 50 * 100);
            coBar.setAttribute('width', coPercent * 2);
        }
        const tempBarVal = document.getElementById('tempBarVal0');
        if (tempBarVal) tempBarVal.textContent = device.sensors.temperature.current.toFixed(1) + '°C';
        const humidityBarVal = document.getElementById('humidityBarVal0');
        if (humidityBarVal) humidityBarVal.textContent = device.sensors.humidity.current.toFixed(0) + '%';
        const coBarVal = document.getElementById('coBarVal0');
        if (coBarVal) coBarVal.textContent = device.sensors.co.current.toFixed(1) + 'ppm';
    }
    updateMainGauge() {
        let totalHealth = 0;
        let normalDevices = 0, warningDevices = 0, criticalDevices = 0;
        this.devices.forEach(device => {
            totalHealth += device.health;
            if (device.health >= 90) normalDevices++;
            else if (device.health >= 70) warningDevices++;
            else criticalDevices++;
        });
        const avgHealth = Math.round(totalHealth / this.devices.length);
        const gaugeProgress = document.getElementById('mainGaugeProgress');
        if (gaugeProgress) {
            const circumference = 534;
            const offset = circumference - (avgHealth / 100) * circumference;
            gaugeProgress.style.strokeDashoffset = offset;
        }
        const gaugeValue = document.getElementById('mainGaugeValue');
        if (gaugeValue) gaugeValue.textContent = avgHealth;
        const statusEl = document.getElementById('systemStatus');
        if (statusEl) {
            if (criticalDevices > 0) {
                statusEl.textContent = 'Critical Alert';
                statusEl.style.color = '#ef4444';
            } else if (warningDevices > 0) {
                statusEl.textContent = 'Warning';
                statusEl.style.color = '#f59e0b';
            } else {
                statusEl.textContent = 'All Systems Normal';
                statusEl.style.color = '#10b981';
            }
        }
        document.getElementById('normalDevices')?.textContent && (document.getElementById('normalDevices').textContent = normalDevices);
        document.getElementById('warningDevices')?.textContent && (document.getElementById('warningDevices').textContent = warningDevices);
        document.getElementById('criticalDevices')?.textContent && (document.getElementById('criticalDevices').textContent = criticalDevices);
        const avgTempEl = document.getElementById('avgTemp');
        const avgHumidityEl = document.getElementById('avgHumidity');
        const avgCurrentEl = document.getElementById('avgCurrent');
        if (avgTempEl) {
            const avgTemp = this.devices.reduce((sum, d) => sum + d.sensors.temperature.current, 0) / this.devices.length;
            avgTempEl.textContent = avgTemp.toFixed(1) + '°C';
        }
        if (avgHumidityEl) {
            const avgHumidity = this.devices.reduce((sum, d) => sum + d.sensors.humidity.current, 0) / this.devices.length;
            avgHumidityEl.textContent = avgHumidity.toFixed(0) + '%';
        }
        if (avgCurrentEl) {
            const totalCurrent = this.devices.reduce((sum, d) => sum + d.sensors.current.current, 0);
            avgCurrentEl.textContent = totalCurrent.toFixed(2) + 'A';
        }
    }
    renderMiniGauges() {
        const device = this.devices[this.state.selectedDevice] || this.devices[0];
        this.renderMiniGauge('tempMiniGauge', device.sensors.temperature, '#f59e0b');
        this.renderMiniGauge('humidityMiniGauge', device.sensors.humidity, '#00c8ff');
        this.renderMiniGauge('currentMiniGauge', device.sensors.current, '#eab308');
    }
    renderMiniGauge(canvasId, sensor, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 30;
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 6;
        ctx.stroke();
        const range = sensor.max - sensor.min;
        const normalized = Math.max(0, Math.min(1, (sensor.current - sensor.min) / range));
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + normalized * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    connectMQTT() {
        if (window.mqttClient) {
            const originalUpdate = window.mqttClient.updateDashboardSensors;
            window.mqttClient.updateDashboardSensors = (data) => {
                if (originalUpdate) originalUpdate.call(window.mqttClient, data);
                this.handleMQTTData(data);
            };
            if (window.mqttClient.client && window.mqttClient.client.isConnected()) {
                this.setConnectionStatus(true);
            }
        } else {
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
        if (data.panelHealth !== undefined) {
            this.state.boardHealth = data.panelHealth;
            this.updateBoardHealth();
        }
        Object.keys(this.sensors).forEach(sensorId => {
            if (data[sensorId] !== undefined) {
                this.updateSensor(sensorId, data[sensorId]);
            }
        });
        this.updateSystemStatus();
        this.updatePanelDisplay();
    }
    updateSensor(sensorId, value) {
        const sensor = this.sensors[sensorId];
        if (!sensor) return;
        sensor.current = value;
        sensor.history.push({ value, time: new Date() });
        if (sensor.history.length > 100) sensor.history.shift();
        if (value >= sensor.thresholds.critical) {
            sensor.status = 'critical';
        } else if (value >= sensor.thresholds.warning) {
            sensor.status = 'warning';
        } else {
            sensor.status = 'normal';
        }
        this.updateSensorUI(sensorId);
        this.updateSensorSparkline(sensorId);
        if (sensor.status !== 'normal') {
            this.addAlert(sensor);
        }
    }
    updateSensorUI(sensorId) {
        const sensor = this.sensors[sensorId];
        const valueEl = document.getElementById(`${sensorId}-card-value`);
        if (valueEl) valueEl.textContent = sensor.current.toFixed(1);
        const statusEl = document.getElementById(`${sensorId}-card-status`);
        if (statusEl) {
            statusEl.innerHTML = `<span class="status-badge ${sensor.status}">${sensor.status.toUpperCase()}</span>`;
        }
        if (sensor.history.length > 0) {
            const values = sensor.history.map(h => h.value);
            const minEl = document.getElementById(`${sensorId}-min`);
            const maxEl = document.getElementById(`${sensorId}-max`);
            if (minEl) minEl.textContent = Math.min(...values).toFixed(1);
            if (maxEl) maxEl.textContent = Math.max(...values).toFixed(1);
        }
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
        const padding = 3;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const points = data.map((v, i) => ({
            x: (i / (data.length - 1)) * width,
            y: height - padding - ((v - min) / range) * (height - padding * 2)
        }));
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[0];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : p2;
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        const fillPathD = pathD + ` L ${width} ${height} L 0 ${height} Z`;
        const color = this.getSensorColor(sensorId);
        const lastPoint = points[points.length - 1];
        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="grad-${sensorId}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.4"/>
                        <stop offset="50%" style="stop-color:${color};stop-opacity:0.15"/>
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0"/>
                    </linearGradient>
                    <filter id="glow-${sensorId}" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <path d="${fillPathD}" fill="url(#grad-${sensorId})"/>
                <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-${sensorId})"/>
                <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="4" fill="${color}" filter="url(#glow-${sensorId})"/>
                <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="2" fill="#fff"/>
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
        document.getElementById('normalSensorCount').textContent = normalCount;
        document.getElementById('warningSensorCount').textContent = warningCount;
        document.getElementById('criticalSensorCount').textContent = criticalCount;
        document.getElementById('onlineSensors').textContent = Object.keys(this.sensors).length;
        document.getElementById('warningCount').textContent = warningCount;
        document.getElementById('criticalCount').textContent = criticalCount;
        const total = Object.keys(this.sensors).length;
        const healthPercent = Math.round(((normalCount + warningCount * 0.5) / total) * 100);
        document.getElementById('healthPercent').textContent = healthPercent;
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
    switchPage(page) {
        this.state.currentPage = page;
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });
        const titles = {
            dashboard: 'Dashboard',
            sensors: 'All Sensors',
            analytics: 'Analytics',
            alerts: 'Alerts'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        document.getElementById('breadcrumbPage').textContent = titles[page] || page;
        if (page === 'analytics') {
            this.updateAnalyticsChart();
            this.updateEnergyFlow();
            this.updateMainGauge();
            this.renderMiniGauges();
        } else if (page === 'sensors') {
            this.renderAllSensorsPage();
            this.updateDeviceOverview();
        } else if (page === 'alerts') {
            this.renderAlertsList();
        }
    }
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
        grid.querySelectorAll('.sensor-full-card').forEach(card => {
            card.addEventListener('click', () => {
                const sensorId = card.dataset.sensor;
                if (sensorId) this.showSensorModal(sensorId);
            });
        });
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
        const padding = 4;
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const points = data.map((v, i) => ({
            x: (i / (data.length - 1)) * width,
            y: height - padding - ((v - min) / range) * (height - padding * 2)
        }));
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[0];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : p2;
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }
        const fillPathD = pathD + ` L ${width} ${height} L 0 ${height} Z`;
        const color = this.getSensorColor(sensorId);
        const lastPoint = points[points.length - 1];
        const lastValue = data[data.length - 1];
        const status = lastValue >= sensor.thresholds.critical ? 'critical' :
                      lastValue >= sensor.thresholds.warning ? 'warning' : 'normal';
        const dotColor = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : color;
        container.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="fullGrad-${sensorId}" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${color};stop-opacity:0.45"/>
                        <stop offset="40%" style="stop-color:${color};stop-opacity:0.2"/>
                        <stop offset="100%" style="stop-color:${color};stop-opacity:0"/>
                    </linearGradient>
                    <filter id="fullGlow-${sensorId}" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <path d="${fillPathD}" fill="url(#fullGrad-${sensorId})"/>
                <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#fullGlow-${sensorId})"/>
                <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="6" fill="${dotColor}" filter="url(#fullGlow-${sensorId})">
                    <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="3" fill="#fff"/>
            </svg>
        `;
    }
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
    updateAnalyticsChart() {
        const canvas = document.getElementById('analyticsCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const sensorId = this.state.selectedSensor || 'temperature';
        const device = this.devices[this.state.selectedDevice] || this.devices[0];
        const sensor = device ? device.sensors[sensorId] : this.sensors[sensorId];
        const count = parseInt(document.getElementById('analyticsTimeRange')?.value || '50');
        let data = sensor.history.slice(-count).map(h => h.value);
        if (data.length < 2) {
            for (let i = 0; i < count; i++) {
                const t = i / count;
                const wave = Math.sin(t * Math.PI * 4) * 0.2 + Math.sin(t * Math.PI * 7) * 0.1;
                data.push(sensor.min + (sensor.max - sensor.min) * (0.3 + wave + Math.random() * 0.1));
            }
        }
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.scale(dpr, dpr);
        const width = rect.width;
        const height = rect.height;
        const padding = { top: 30, right: 30, bottom: 40, left: 55 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        const min = Math.min(...data) * 0.95;
        const max = Math.max(...data) * 1.05;
        const range = max - min || 1;
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        this.drawPremiumGrid(ctx, padding, chartWidth, chartHeight, min, max, range, width, height);
        const points = data.map((v, i) => ({
            x: padding.left + (i / (data.length - 1)) * chartWidth,
            y: padding.top + ((max - v) / range) * chartHeight
        }));
        const color = this.getSensorColor(sensorId);
        this.drawChartGradientFill(ctx, points, color, padding, height);
        this.drawBezierCurve(ctx, points, color);
        this.drawDataPoints(ctx, points, color, data, sensor);
        this.drawThresholdLines(ctx, sensor, padding, chartWidth, chartHeight, min, max, range);
        this.updateChartStats(sensor, sensorId);
        document.getElementById('totalAlerts').textContent = this.state.alerts.length;
    }
    drawPremiumGrid(ctx, padding, chartWidth, chartHeight, min, max, range, width, height) {
        const gridLines = 6;
        for (let i = 0; i <= gridLines; i++) {
            const y = padding.top + (i / gridLines) * chartHeight;
            const alpha = i === 0 || i === gridLines ? 0.15 : 0.06;
            ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
            ctx.lineWidth = i === 0 || i === gridLines ? 1 : 0.5;
            ctx.setLineDash(i === 0 || i === gridLines ? [] : [4, 4]);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
            ctx.setLineDash([]);
            const val = max - (i / gridLines) * range;
            ctx.font = '600 11px Inter';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(1), padding.left - 10, y + 4);
        }
        const vLines = 8;
        for (let i = 0; i <= vLines; i++) {
            const x = padding.left + (i / vLines) * chartWidth;
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.04)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, height - padding.bottom);
            ctx.stroke();
            if (i % 2 === 0) {
                ctx.font = '500 10px Inter';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.textAlign = 'center';
                const timeAgo = Math.round((1 - i / vLines) * 60);
                ctx.fillText(timeAgo === 0 ? 'Now' : `-${timeAgo}s`, x, height - padding.bottom + 20);
            }
        }
    }
    drawChartGradientFill(ctx, points, color, padding, height) {
        if (points.length < 2) return;
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, this.hexToRgba(color, 0.35));
        gradient.addColorStop(0.3, this.hexToRgba(color, 0.2));
        gradient.addColorStop(0.7, this.hexToRgba(color, 0.08));
        gradient.addColorStop(1, this.hexToRgba(color, 0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, height - padding.bottom);
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cpx = (p0.x + p1.x) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, cpx, (p0.y + p1.y) / 2);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
        ctx.closePath();
        ctx.fill();
    }
    drawBezierCurve(ctx, points, color) {
        if (points.length < 2) return;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[0];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : p2;
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = i > 0 ? points[i - 1] : points[0];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = i < points.length - 2 ? points[i + 2] : p2;
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        }
        ctx.stroke();
    }
    drawDataPoints(ctx, points, color, data, sensor) {
        const step = Math.max(1, Math.floor(points.length / 15));
        points.forEach((point, i) => {
            if (i % step !== 0 && i !== points.length - 1) return;
            const isLast = i === points.length - 1;
            const value = data[i];
            const status = value >= sensor.thresholds.critical ? 'critical' :
                          value >= sensor.thresholds.warning ? 'warning' : 'normal';
            ctx.shadowColor = isLast ? color : 'transparent';
            ctx.shadowBlur = isLast ? 20 : 0;
            ctx.beginPath();
            ctx.arc(point.x, point.y, isLast ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = status === 'critical' ? '#ef4444' :
                           status === 'warning' ? '#f59e0b' :
                           this.hexToRgba(color, 0.2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(point.x, point.y, isLast ? 4 : 2.5, 0, Math.PI * 2);
            ctx.fillStyle = isLast ? '#fff' : color;
            ctx.fill();
            ctx.shadowBlur = 0;
            if (isLast) {
                const tooltipWidth = 60;
                const tooltipHeight = 28;
                const tooltipX = point.x - tooltipWidth / 2;
                const tooltipY = point.y - tooltipHeight - 15;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.beginPath();
                ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 6);
                ctx.fill();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(value.toFixed(1) + sensor.unit, point.x, tooltipY + 18);
            }
        });
    }
    drawThresholdLines(ctx, sensor, padding, chartWidth, chartHeight, min, max, range) {
        if (sensor.thresholds.warning >= min && sensor.thresholds.warning <= max) {
            const y = padding.top + ((max - sensor.thresholds.warning) / range) * chartHeight;
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#f59e0b';
            ctx.font = '600 9px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('WARNING', padding.left + chartWidth + 5, y + 3);
        }
        if (sensor.thresholds.critical >= min && sensor.thresholds.critical <= max) {
            const y = padding.top + ((max - sensor.thresholds.critical) / range) * chartHeight;
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ef4444';
            ctx.font = '600 9px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('CRITICAL', padding.left + chartWidth + 5, y + 3);
        }
    }
    updateChartStats(sensor, sensorId) {
        if (sensor.history.length > 0) {
            const values = sensor.history.map(h => h.value);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            if (sensorId === 'temperature') {
                document.getElementById('avgTemp')?.textContent && (document.getElementById('avgTemp').textContent = avg.toFixed(1) + '°C');
                document.getElementById('tempRange')?.textContent && (document.getElementById('tempRange').textContent = `${minVal.toFixed(1)} ~ ${maxVal.toFixed(1)}°C`);
            } else if (sensorId === 'humidity') {
                document.getElementById('avgHumidity')?.textContent && (document.getElementById('avgHumidity').textContent = avg.toFixed(1) + '%');
                document.getElementById('humidityRange')?.textContent && (document.getElementById('humidityRange').textContent = `${minVal.toFixed(0)} ~ ${maxVal.toFixed(0)}%`);
            } else if (sensorId === 'current') {
                document.getElementById('avgCurrent')?.textContent && (document.getElementById('avgCurrent').textContent = avg.toFixed(2) + 'A');
                document.getElementById('totalCurrent')?.textContent && (document.getElementById('totalCurrent').textContent = (avg * 3).toFixed(2) + 'A');
            }
        }
    }
    hexToRgba(hex, alpha) {
        const colors = {
            '#ff6b35': `rgba(255, 107, 53, ${alpha})`,
            '#00d4ff': `rgba(0, 212, 255, ${alpha})`,
            '#6366f1': `rgba(99, 102, 241, ${alpha})`,
            '#ffc107': `rgba(255, 193, 7, ${alpha})`,
            '#8a2be2': `rgba(138, 43, 226, ${alpha})`,
            '#ff1493': `rgba(255, 20, 147, ${alpha})`,
            '#00ff88': `rgba(0, 255, 136, ${alpha})`,
            '#ffd700': `rgba(255, 215, 0, ${alpha})`,
            '#a855f7': `rgba(168, 85, 247, ${alpha})`,
            '#ff3b5c': `rgba(255, 59, 92, ${alpha})`,
            '#6c757d': `rgba(108, 117, 125, ${alpha})`,
            '#ffff00': `rgba(255, 255, 0, ${alpha})`
        };
        return colors[hex] || `rgba(0, 200, 255, ${alpha})`;
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
        const bgGradient = ctx.createLinearGradient(0, 0, width, 0);
        bgGradient.addColorStop(0, 'rgba(255,255,255,0.05)');
        bgGradient.addColorStop(1, 'rgba(255,255,255,0.1)');
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
        ctx.strokeStyle = bgGradient;
        ctx.lineWidth = 12;
        ctx.stroke();
        const range = sensor.max - sensor.min;
        const normalized = Math.max(0, Math.min(1, (sensor.current - sensor.min) / range));
        const endAngle = Math.PI + normalized * Math.PI;
        let color = '#10b981';
        if (sensor.status === 'warning') color = '#f59e0b';
        else if (sensor.status === 'critical') color = '#ef4444';
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false);
        ctx.strokeStyle = color;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.shadowBlur = 0;
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
        let normalCount = 0, warningCount = 0, criticalCount = 0;
        Object.values(this.sensors).forEach(sensor => {
            if (sensor.status === 'critical') criticalCount++;
            else if (sensor.status === 'warning') warningCount++;
            else normalCount++;
        });
        const total = Object.keys(this.sensors).length;
        const healthPercent = Math.round(((normalCount + warningCount * 0.5) / total) * 100);
        const valueEl = document.getElementById('systemHealthValue');
        if (valueEl) valueEl.textContent = healthPercent;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 16;
        ctx.stroke();
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (healthPercent / 100) * Math.PI * 2;
        let color = '#10b981';
        if (healthPercent < 50) color = '#ef4444';
        else if (healthPercent < 75) color = '#f59e0b';
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#00c8ff');
        gradient.addColorStop(1, '#7c3aed');
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
        ctx.strokeStyle = healthPercent >= 75 ? gradient : color;
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 25, 0, Math.PI * 2, false);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    renderSensorSummary() {
        const grid = document.getElementById('sensorSummaryGrid');
        if (!grid) return;
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
        grid.querySelectorAll('.sensor-summary-item').forEach(item => {
            item.addEventListener('click', () => {
                const sensorId = item.dataset.sensor;
                if (sensorId) this.showSensorModal(sensorId);
            });
        });
    }
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
        const recent = this.state.alerts.find(a =>
            a.sensorId === alert.sensorId &&
            Date.now() - a.time.getTime() < 30000
        );
        if (recent) return;
        this.state.alerts.unshift(alert);
        if (this.state.alerts.length > 50) this.state.alerts.pop();
        document.getElementById('sidebarAlertCount').textContent = this.state.alerts.length;
        this.showToast(alert);
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
document.addEventListener('DOMContentLoaded', () => {
    window.aico3D = new AICO3DDashboard();
});
