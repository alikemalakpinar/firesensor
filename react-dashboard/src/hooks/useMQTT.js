import { useEffect, useCallback, useRef } from 'react';
import Paho from 'paho-mqtt';
import { useSensorStore } from '../stores/useSensorStore';

// MQTT Configuration
const MQTT_CONFIG = {
  host: '213.142.151.191',
  port: 9001,
  topic: 'aicofire',
  clientId: `aico-react-${Math.random().toString(16).substring(2, 10)}`,
  reconnectDelay: 3000,
  maxReconnectAttempts: 10,
};

// Warning1 bit definitions (8 sensors for gas/air)
const WARNING1_SENSORS = [
  'temperature',
  'humidity',
  'gas',
  'air-quality',
  'no2',
  'co',
  'tvoc',
  'eco2',
];

// Warning2 bit definitions (4 sensors for physical)
const WARNING2_SENSORS = [
  'surface-temp',
  'surface-temp-2',
  'pressure',
  'current',
];

/**
 * Convert hex string to byte value
 */
function hexToByte(hexString) {
  if (!hexString || hexString.length < 2) return 0;
  return parseInt(hexString, 16) || 0;
}

/**
 * Parse Warning1 byte to get anomaly sensor IDs
 * Warning1 contains 8 bits for: temp, humidity, gas, air-quality, no2, co, tvoc, eco2
 */
function parseWarning1(warningHex) {
  const warningByte = hexToByte(warningHex);
  const anomalies = [];

  for (let i = 0; i < 8; i++) {
    if ((warningByte >> i) & 1) {
      anomalies.push(WARNING1_SENSORS[i]);
    }
  }

  return anomalies;
}

/**
 * Parse Warning2 byte to get anomaly sensor IDs
 * Warning2 contains 4 bits for: surface-temp, surface-temp-2, pressure, current
 */
function parseWarning2(warningHex) {
  const warningByte = hexToByte(warningHex);
  const anomalies = [];

  for (let i = 0; i < 4; i++) {
    if ((warningByte >> i) & 1) {
      anomalies.push(WARNING2_SENSORS[i]);
    }
  }

  return anomalies;
}

/**
 * Parse the MQTT message payload
 * Format: A;temp;humidity;gas;air-quality;no2;co;tvoc;eco2;surface-temp1;surface-temp2;pressure;current;warning2;warning1;panelHealth;B
 */
function parseFireSensorData(message) {
  try {
    const parts = message.split(';');

    // Validate message format
    if (parts.length < 17 || parts[0] !== 'A' || parts[parts.length - 1] !== 'B') {
      console.warn('[MQTT] Invalid message format:', message);
      return null;
    }

    // Parse sensor values
    const sensorData = {
      temperature: parseFloat(parts[1]) || 0,
      humidity: parseFloat(parts[2]) || 0,
      gas: parseFloat(parts[3]) || 0,
      'air-quality': parseFloat(parts[4]) || 0,
      no2: parseFloat(parts[5]) || 0,
      co: parseFloat(parts[6]) || 0,
      tvoc: parseFloat(parts[7]) || 0,
      eco2: parseFloat(parts[8]) || 0,
      'surface-temp': parseFloat(parts[9]) || 0,
      'surface-temp-2': parseFloat(parts[10]) || 0,
      pressure: parseFloat(parts[11]) || 0,
      current: parseFloat(parts[12]) || 0,
    };

    // Parse warning flags
    const warning2Hex = parts[13];
    const warning1Hex = parts[14];
    const panelHealth = parseFloat(parts[15]) || 100;

    // Get anomaly sensor IDs from warning bytes
    const anomalySensorIds = [
      ...parseWarning1(warning1Hex),
      ...parseWarning2(warning2Hex),
    ];

    return {
      sensorData,
      anomalySensorIds,
      panelHealth,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[MQTT] Parse error:', error);
    return null;
  }
}

/**
 * Custom hook for MQTT connection and data handling
 */
export function useMQTT() {
  const clientRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const {
    setConnectionStatus,
    updateBulkSensors,
    setPanelHealth,
    setSystemStatus,
  } = useSensorStore();

  const connect = useCallback(() => {
    // Cleanup existing client
    if (clientRef.current) {
      try {
        clientRef.current.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }

    setConnectionStatus('connecting');
    console.log('[MQTT] Connecting to', MQTT_CONFIG.host);

    const client = new Paho.Client(
      MQTT_CONFIG.host,
      MQTT_CONFIG.port,
      MQTT_CONFIG.clientId
    );

    client.onConnectionLost = (responseObject) => {
      console.warn('[MQTT] Connection lost:', responseObject.errorMessage);
      setConnectionStatus('disconnected');
      setSystemStatus('offline');
      scheduleReconnect();
    };

    client.onMessageArrived = (message) => {
      const payload = message.payloadString;
      const parsed = parseFireSensorData(payload);

      if (parsed) {
        updateBulkSensors(parsed.sensorData, parsed.anomalySensorIds);
        setPanelHealth(parsed.panelHealth);
      }
    };

    client.connect({
      onSuccess: () => {
        console.log('[MQTT] Connected successfully');
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Subscribe to topic
        client.subscribe(MQTT_CONFIG.topic, {
          onSuccess: () => {
            console.log('[MQTT] Subscribed to', MQTT_CONFIG.topic);
          },
          onFailure: (err) => {
            console.error('[MQTT] Subscribe failed:', err);
          },
        });
      },
      onFailure: (err) => {
        console.error('[MQTT] Connection failed:', err);
        setConnectionStatus('error');
        scheduleReconnect();
      },
      useSSL: false,
      timeout: 10,
    });

    clientRef.current = client;
  }, [setConnectionStatus, updateBulkSensors, setPanelHealth, setSystemStatus]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MQTT_CONFIG.maxReconnectAttempts) {
      console.error('[MQTT] Max reconnect attempts reached');
      setConnectionStatus('error');
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = MQTT_CONFIG.reconnectDelay + (reconnectAttemptsRef.current * 1000);

    console.log(`[MQTT] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, setConnectionStatus]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (clientRef.current) {
      try {
        clientRef.current.disconnect();
      } catch (e) {
        // Ignore errors
      }
      clientRef.current = null;
    }

    setConnectionStatus('disconnected');
  }, [setConnectionStatus]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected: useSensorStore((s) => s.connectionStatus === 'connected'),
  };
}

// For demo/development - simulate MQTT data
export function useMQTTSimulator() {
  const { updateBulkSensors, setConnectionStatus, setPanelHealth } = useSensorStore();
  const intervalRef = useRef(null);

  useEffect(() => {
    setConnectionStatus('connected');

    const generateData = () => {
      const sensorData = {
        temperature: 22 + Math.random() * 8 - 4,
        humidity: 45 + Math.random() * 20 - 10,
        gas: 150 + Math.random() * 100,
        'air-quality': 50 + Math.random() * 100,
        no2: Math.random() * 2,
        co: Math.random() * 10,
        tvoc: Math.random() * 300,
        eco2: 400 + Math.random() * 600,
        'surface-temp': 25 + Math.random() * 10,
        'surface-temp-2': 26 + Math.random() * 10,
        pressure: 1000 + Math.random() * 20 - 10,
        current: 50 + Math.random() * 100,
      };

      // Randomly trigger alerts (5% chance per update)
      const anomalySensorIds = [];
      if (Math.random() < 0.05) {
        const sensors = Object.keys(sensorData);
        const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];
        anomalySensorIds.push(randomSensor);
      }

      updateBulkSensors(sensorData, anomalySensorIds);
      setPanelHealth(95 + Math.random() * 5);
    };

    // Initial data
    generateData();

    // Update every 2 seconds
    intervalRef.current = setInterval(generateData, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setConnectionStatus('disconnected');
    };
  }, [updateBulkSensors, setConnectionStatus, setPanelHealth]);
}

export default useMQTT;
