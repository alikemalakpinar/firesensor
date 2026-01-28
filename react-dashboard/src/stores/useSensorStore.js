import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Sensor configuration matching legacy system
const SENSOR_CONFIG = {
  temperature: { unit: '°C', min: -20, max: 80, label: 'Temperature', icon: 'Thermometer', color: '#FF6B6B' },
  humidity: { unit: '%', min: 0, max: 100, label: 'Humidity', icon: 'Droplets', color: '#4ECDC4' },
  gas: { unit: 'kOhm', min: 0, max: 500, label: 'Gas Resistance', icon: 'Wind', color: '#95E1D3' },
  'air-quality': { unit: 'IAQ', min: 0, max: 500, label: 'Air Quality', icon: 'Activity', color: '#00F0FF' },
  no2: { unit: 'ppm', min: 0, max: 10, label: 'NO₂', icon: 'AlertTriangle', color: '#FFB30F' },
  co: { unit: 'ppm', min: 0, max: 100, label: 'CO', icon: 'Skull', color: '#FF2A6D' },
  tvoc: { unit: 'ppb', min: 0, max: 1000, label: 'TVOC', icon: 'Cloud', color: '#A78BFA' },
  eco2: { unit: 'ppm', min: 400, max: 5000, label: 'eCO₂', icon: 'Leaf', color: '#34D399' },
  'surface-temp': { unit: '°C', min: -20, max: 150, label: 'Surface Temp 1', icon: 'Flame', color: '#F97316' },
  'surface-temp-2': { unit: '°C', min: -20, max: 150, label: 'Surface Temp 2', icon: 'Flame', color: '#FB923C' },
  pressure: { unit: 'hPa', min: 900, max: 1100, label: 'Pressure', icon: 'Gauge', color: '#6366F1' },
  current: { unit: 'mA', min: 0, max: 1000, label: 'Current', icon: 'Zap', color: '#FBBF24' },
};

// 3D positions for each sensor in the digital twin
const SENSOR_POSITIONS = {
  temperature: { x: -3, y: 6, z: 2, floor: 2 },
  humidity: { x: 3, y: 6, z: -2, floor: 2 },
  gas: { x: 0, y: 4, z: 0, floor: 1 },
  'air-quality': { x: -4, y: 4, z: -3, floor: 1 },
  no2: { x: 4, y: 2, z: 3, floor: 0 },
  co: { x: -2, y: 2, z: -4, floor: 0 },
  tvoc: { x: 2, y: 6, z: 3, floor: 2 },
  eco2: { x: -4, y: 4, z: 3, floor: 1 },
  'surface-temp': { x: 0, y: 2, z: -3, floor: 0 },
  'surface-temp-2': { x: 3, y: 4, z: 0, floor: 1 },
  pressure: { x: -3, y: 2, z: 2, floor: 0 },
  current: { x: 4, y: 6, z: -3, floor: 2 },
};

// Initialize sensors with default values
const initializeSensors = () => {
  const sensors = {};
  Object.keys(SENSOR_CONFIG).forEach((id) => {
    sensors[id] = {
      id,
      ...SENSOR_CONFIG[id],
      position: SENSOR_POSITIONS[id],
      value: 0,
      history: [],
      status: 'normal', // 'normal' | 'warning' | 'critical' | 'offline'
      trend: 'stable', // 'rising' | 'falling' | 'stable'
      lastUpdate: null,
    };
  });
  return sensors;
};

export const useSensorStore = create(
  subscribeWithSelector((set, get) => ({
    // Sensor data
    sensors: initializeSensors(),

    // System state
    systemStatus: 'normal', // 'normal' | 'warning' | 'critical' | 'offline'
    connectionStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'error'
    panelHealth: 100,
    lastMessageTime: null,

    // UI state
    selectedSensor: null,
    activePage: 'dashboard',
    sidebarCollapsed: false,
    cameraTarget: null,

    // Actions
    updateSensor: (sensorId, value, status = null) => {
      set((state) => {
        const sensor = state.sensors[sensorId];
        if (!sensor) return state;

        const newHistory = [...sensor.history, value].slice(-60); // Keep last 60 values
        const trend = calculateTrend(newHistory);

        return {
          sensors: {
            ...state.sensors,
            [sensorId]: {
              ...sensor,
              value,
              history: newHistory,
              status: status || sensor.status,
              trend,
              lastUpdate: Date.now(),
            },
          },
          lastMessageTime: Date.now(),
        };
      });
    },

    updateSensorStatus: (sensorId, status) => {
      set((state) => ({
        sensors: {
          ...state.sensors,
          [sensorId]: {
            ...state.sensors[sensorId],
            status,
          },
        },
      }));
    },

    updateBulkSensors: (sensorData, anomalySensorIds = []) => {
      set((state) => {
        const updatedSensors = { ...state.sensors };
        let hasWarning = false;
        let hasCritical = false;

        Object.entries(sensorData).forEach(([id, value]) => {
          if (updatedSensors[id]) {
            const isCritical = anomalySensorIds.includes(id);
            const newHistory = [...updatedSensors[id].history, value].slice(-60);
            const trend = calculateTrend(newHistory);

            updatedSensors[id] = {
              ...updatedSensors[id],
              value,
              history: newHistory,
              status: isCritical ? 'critical' : 'normal',
              trend,
              lastUpdate: Date.now(),
            };

            if (isCritical) hasCritical = true;
          }
        });

        const systemStatus = hasCritical ? 'critical' : hasWarning ? 'warning' : 'normal';

        return {
          sensors: updatedSensors,
          systemStatus,
          lastMessageTime: Date.now(),
        };
      });
    },

    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setSystemStatus: (status) => set({ systemStatus: status }),
    setPanelHealth: (health) => set({ panelHealth: health }),

    selectSensor: (sensorId) => set({ selectedSensor: sensorId }),
    setActivePage: (page) => set({ activePage: page }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setCameraTarget: (target) => set({ cameraTarget: target }),

    // Computed getters
    getCriticalSensors: () => {
      const { sensors } = get();
      return Object.values(sensors).filter((s) => s.status === 'critical');
    },

    getWarningSensors: () => {
      const { sensors } = get();
      return Object.values(sensors).filter((s) => s.status === 'warning');
    },

    getSensorById: (id) => get().sensors[id],
  }))
);

// Calculate trend from history
function calculateTrend(history) {
  if (history.length < 5) return 'stable';

  const recent = history.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  const threshold = avg * 0.05; // 5% change threshold

  if (diff > threshold) return 'rising';
  if (diff < -threshold) return 'falling';
  return 'stable';
}

// Export sensor config for use elsewhere
export { SENSOR_CONFIG, SENSOR_POSITIONS };
