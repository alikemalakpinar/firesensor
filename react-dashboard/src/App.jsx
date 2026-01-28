import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { DigitalTwin } from './components/3d/DigitalTwin';
import { Sidebar } from './components/hud/Sidebar';
import { Vignette, AlertBanner } from './components/hud/Vignette';
import { HeroMetric } from './components/hud/HeroMetric';
import { SensorChip, SensorChipGrid } from './components/hud/SensorChip';
import GlassPanel, { GlassCard } from './components/ui/GlassPanel';

// Hooks and stores
import { useMQTTSimulator } from './hooks/useMQTT';
import { useSensorStore } from './stores/useSensorStore';

// Icons
import {
  Activity,
  Shield,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import './index.css';

/**
 * BootSequence - Initial loading animation
 */
function BootSequence({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState([]);

  const bootMessages = [
    'Initializing AICO Fire Detection System...',
    'Establishing MQTT connection...',
    'Loading 3D Digital Twin...',
    'Calibrating sensor modules...',
    'Synchronizing data streams...',
    'Activating neural monitoring...',
    'System online.',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const messageIndex = Math.floor((progress / 100) * bootMessages.length);
    const currentMessages = bootMessages.slice(0, messageIndex + 1);
    setMessages(currentMessages);
  }, [progress]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-void-black flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center max-w-md px-8">
        {/* Logo */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-electric-cyan/10 border border-electric-cyan/30 flex items-center justify-center"
          animate={{ boxShadow: ['0 0 30px rgba(0, 240, 255, 0.2)', '0 0 50px rgba(0, 240, 255, 0.4)', '0 0 30px rgba(0, 240, 255, 0.2)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Shield className="text-electric-cyan" size={40} />
        </motion.div>

        {/* Title */}
        <h1 className="font-rajdhani font-bold text-3xl text-white mb-2">
          AICO FIRE DETECTION
        </h1>
        <p className="text-electric-cyan text-sm uppercase tracking-widest mb-8">
          Tactical Command Center
        </p>

        {/* Progress bar */}
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden mb-6">
          <motion.div
            className="absolute inset-y-0 left-0 bg-electric-cyan rounded-full"
            style={{ width: `${progress}%` }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 bg-white/50 rounded-full blur-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Messages */}
        <div className="h-32 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.p
                key={i}
                className="text-white/60 text-sm font-mono mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: i === messages.length - 1 ? 1 : 0.4, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-electric-cyan mr-2">&gt;</span>
                {msg}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress percentage */}
        <p className="text-white/40 text-xs font-mono mt-4">
          {progress.toFixed(0)}% COMPLETE
        </p>
      </div>
    </motion.div>
  );
}

/**
 * StatusBar - Top status bar showing connection and system info
 */
function StatusBar() {
  const connectionStatus = useSensorStore((state) => state.connectionStatus);
  const panelHealth = useSensorStore((state) => state.panelHealth);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isConnected = connectionStatus === 'connected';
  const ConnectionIcon = isConnected ? Wifi : WifiOff;

  const formatTime = (date) => {
    return date.toLocaleTimeString();
  };

  return (
    <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
      {/* System time */}
      <GlassPanel size="sm" variant="minimal" className="px-3 py-2" animated={false}>
        <div className="flex items-center gap-2 text-white/60">
          <Clock size={14} />
          <span className="text-xs font-mono">{formatTime(currentTime)}</span>
        </div>
      </GlassPanel>

      {/* Panel health */}
      <GlassPanel size="sm" variant="minimal" className="px-3 py-2" animated={false}>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              panelHealth > 90
                ? 'bg-emerald-400'
                : panelHealth > 70
                  ? 'bg-amber'
                  : 'bg-neon-red'
            }`}
          />
          <span className="text-xs font-mono text-white/60">
            HEALTH: {panelHealth.toFixed(0)}%
          </span>
        </div>
      </GlassPanel>

      {/* Connection status */}
      <GlassPanel
        size="sm"
        variant={isConnected ? 'accent' : 'critical'}
        className="px-3 py-2"
        animated={false}
      >
        <div className="flex items-center gap-2">
          <ConnectionIcon
            size={14}
            className={isConnected ? 'text-electric-cyan' : 'text-neon-red'}
          />
          <span
            className={`text-xs font-mono uppercase ${
              isConnected ? 'text-electric-cyan' : 'text-neon-red'
            }`}
          >
            {connectionStatus}
          </span>
        </div>
      </GlassPanel>
    </div>
  );
}

/**
 * DashboardPage - Main dashboard view
 */
function DashboardPage() {
  const sidebarCollapsed = useSensorStore((state) => state.sidebarCollapsed);

  return (
    <motion.div
      className="h-full p-6 overflow-auto"
      style={{
        marginLeft: sidebarCollapsed ? 72 : 240,
        transition: 'margin-left 0.3s ease',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HeroMetric sensorId="air-quality" title="Air Quality Index" />
        <HeroMetric sensorId="temperature" title="Ambient Temperature" />
        <HeroMetric sensorId="co" title="Carbon Monoxide" />
        <HeroMetric sensorId="humidity" title="Humidity Level" />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sensor grid */}
        <div className="lg:col-span-2">
          <GlassCard
            title="Sensor Overview"
            subtitle="Real-time monitoring"
            icon={Activity}
            className="h-full"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['gas', 'no2', 'tvoc', 'eco2', 'surface-temp', 'pressure'].map(
                (id) => (
                  <SensorChip key={id} sensorId={id} />
                )
              )}
            </div>
          </GlassCard>
        </div>

        {/* System status */}
        <div>
          <SystemStatusCard />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * SensorsPage - Detailed sensor view
 */
function SensorsPage() {
  const sidebarCollapsed = useSensorStore((state) => state.sidebarCollapsed);

  return (
    <motion.div
      className="h-full p-6 overflow-auto"
      style={{
        marginLeft: sidebarCollapsed ? 72 : 240,
        transition: 'margin-left 0.3s ease',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h2 className="font-rajdhani font-bold text-2xl text-white mb-6">
        All Sensors
      </h2>
      <SensorChipGrid />
    </motion.div>
  );
}

/**
 * SystemStatusCard - Shows overall system health
 */
function SystemStatusCard() {
  const systemStatus = useSensorStore((state) => state.systemStatus);
  const sensors = useSensorStore((state) => state.sensors);

  const criticalCount = Object.values(sensors).filter(
    (s) => s.status === 'critical'
  ).length;
  const warningCount = Object.values(sensors).filter(
    (s) => s.status === 'warning'
  ).length;
  const normalCount = Object.values(sensors).filter(
    (s) => s.status === 'normal'
  ).length;

  const StatusIcon = systemStatus === 'critical' ? AlertCircle : CheckCircle;

  return (
    <GlassCard
      title="System Status"
      subtitle="Overall health"
      icon={Shield}
      variant={systemStatus === 'critical' ? 'critical' : 'default'}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            ${
              systemStatus === 'critical'
                ? 'bg-neon-red/20'
                : systemStatus === 'warning'
                  ? 'bg-amber/20'
                  : 'bg-emerald-400/20'
            }
          `}
        >
          <StatusIcon
            size={32}
            className={
              systemStatus === 'critical'
                ? 'text-neon-red'
                : systemStatus === 'warning'
                  ? 'text-amber'
                  : 'text-emerald-400'
            }
          />
        </div>
        <div>
          <p
            className={`
              font-rajdhani font-bold text-2xl uppercase
              ${
                systemStatus === 'critical'
                  ? 'text-neon-red'
                  : systemStatus === 'warning'
                    ? 'text-amber'
                    : 'text-emerald-400'
              }
            `}
          >
            {systemStatus}
          </p>
          <p className="text-white/50 text-sm">System operational status</p>
        </div>
      </div>

      {/* Sensor counts */}
      <div className="grid grid-cols-3 gap-3">
        <StatusCount label="Normal" count={normalCount} color="emerald" />
        <StatusCount label="Warning" count={warningCount} color="amber" />
        <StatusCount label="Critical" count={criticalCount} color="red" />
      </div>
    </GlassCard>
  );
}

function StatusCount({ label, count, color }) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber: 'text-amber bg-amber/10',
    red: 'text-neon-red bg-neon-red/10',
  };

  return (
    <div className={`p-3 rounded-lg text-center ${colors[color]}`}>
      <p className="text-2xl font-rajdhani font-bold">{count}</p>
      <p className="text-xs uppercase opacity-70">{label}</p>
    </div>
  );
}

/**
 * App - Main application component
 */
export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const activePage = useSensorStore((state) => state.activePage);
  const setCameraTarget = useSensorStore((state) => state.setCameraTarget);

  // Use simulator for development (replace with useMQTT for production)
  useMQTTSimulator();

  const handleSensorClick = (sensorId) => {
    setCameraTarget(sensorId);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-void-black">
      {/* Boot sequence */}
      <AnimatePresence>
        {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}
      </AnimatePresence>

      {/* Main application */}
      {!isBooting && (
        <>
          {/* 3D Digital Twin background */}
          <div className="fixed inset-0 z-0">
            <DigitalTwin onSensorClick={handleSensorClick} />
          </div>

          {/* Vignette overlay effect */}
          <Vignette />

          {/* Alert banner */}
          <AlertBanner />

          {/* Status bar */}
          <StatusBar />

          {/* Sidebar navigation */}
          <Sidebar />

          {/* Page content */}
          <main className="relative z-10 h-full">
            <AnimatePresence mode="wait">
              {activePage === 'dashboard' && (
                <DashboardPage key="dashboard" />
              )}
              {activePage === 'sensors' && <SensorsPage key="sensors" />}
              {activePage === 'analytics' && (
                <motion.div
                  key="analytics"
                  className="h-full flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassPanel className="p-8">
                    <p className="text-white/60">Analytics page coming soon...</p>
                  </GlassPanel>
                </motion.div>
              )}
              {activePage === 'alerts' && (
                <motion.div
                  key="alerts"
                  className="h-full flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassPanel className="p-8">
                    <p className="text-white/60">Alerts page coming soon...</p>
                  </GlassPanel>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}
