import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { DigitalTwin } from './components/3d/DigitalTwin';
import { BottomNavigation, MiniStatusBar } from './components/hud/BottomNavigation';
import { Vignette, AlertBanner } from './components/hud/Vignette';
import { TachometerGauge, SystemHealthGauge } from './components/hud/TachometerGauge';
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
  AlertCircle,
  CheckCircle,
  Flame,
  Zap,
  Thermometer,
  Wind,
} from 'lucide-react';

import './index.css';

/**
 * BootSequence - Initial loading animation with ember theme
 */
function BootSequence({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState([]);

  const bootMessages = [
    'Initializing FIRELINK System...',
    'Establishing MQTT connection...',
    'Loading 3D Digital Twin...',
    'Calibrating sensor array...',
    'Synchronizing data streams...',
    'Activating thermal monitoring...',
    'System ignited.',
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
      className="fixed inset-0 z-[200] bg-phantom-black flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center max-w-md px-8">
        {/* Logo */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-burnt-orange/10 border border-burnt-orange/30 flex items-center justify-center"
          animate={{
            boxShadow: [
              '0 0 30px rgba(255, 69, 0, 0.2)',
              '0 0 50px rgba(255, 69, 0, 0.4)',
              '0 0 30px rgba(255, 69, 0, 0.2)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Flame className="text-burnt-orange" size={40} />
        </motion.div>

        {/* Title */}
        <h1 className="font-rajdhani font-bold text-3xl text-white mb-2">
          FIRELINK DETECTION
        </h1>
        <p className="text-burnt-orange text-sm uppercase tracking-widest mb-8">
          Industrial Monitoring System
        </p>

        {/* Progress bar */}
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden mb-6">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #FF8C00, #FF4500, #DC2F02)',
            }}
          />
          <motion.div
            className="absolute inset-y-0 left-0 bg-white/30 rounded-full blur-sm"
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
                animate={{
                  opacity: i === messages.length - 1 ? 1 : 0.4,
                  y: 0,
                }}
                exit={{ opacity: 0 }}
              >
                <span className="text-burnt-orange mr-2">&gt;</span>
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
 * TopHeader - Minimal header with time and branding
 */
function TopHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-burnt-orange/20 border border-burnt-orange/30 flex items-center justify-center">
            <Flame className="text-burnt-orange" size={20} />
          </div>
          <div>
            <h1 className="font-rajdhani font-bold text-white text-lg tracking-wider">
              FIRELINK
            </h1>
            <p className="text-[10px] text-burnt-orange/80 uppercase tracking-widest">
              AICO Detection System
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="text-right pointer-events-auto">
          <p className="font-mono text-off-white text-lg">{formatTime(currentTime)}</p>
          <p className="text-xs text-dim-grey uppercase tracking-wider">
            {formatDate(currentTime)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardPage - Main dashboard with tachometer gauges
 */
function DashboardPage() {
  return (
    <motion.div
      className="h-full pt-20 pb-32 px-4 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hero Gauges Row */}
      <div className="flex justify-center gap-6 mb-6 flex-wrap">
        <GlassPanel variant="ember" className="p-4">
          <TachometerGauge
            sensorId="temperature"
            title="Temperature"
            size={160}
          />
        </GlassPanel>
        <GlassPanel variant="ember" className="p-4">
          <TachometerGauge sensorId="co" title="Carbon Monoxide" size={160} />
        </GlassPanel>
        <GlassPanel variant="ember" className="p-4">
          <TachometerGauge sensorId="humidity" title="Humidity" size={160} />
        </GlassPanel>
        <GlassPanel variant="ember" className="p-4">
          <SystemHealthGauge size={160} />
        </GlassPanel>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {/* Sensor Overview */}
        <div className="lg:col-span-2">
          <GlassCard
            title="Sensor Overview"
            subtitle="Real-time monitoring"
            icon={Activity}
            variant="ember"
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

        {/* System Status */}
        <div>
          <SystemStatusCard />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * SensorsPage - Detailed sensor view with all sensors
 */
function SensorsPage() {
  return (
    <motion.div
      className="h-full pt-20 pb-32 px-4 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="font-rajdhani font-bold text-2xl text-white mb-6 flex items-center gap-3">
          <Zap className="text-burnt-orange" size={24} />
          All Sensors
        </h2>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <QuickStat sensorId="temperature" icon={Thermometer} />
          <QuickStat sensorId="humidity" icon={Wind} />
          <QuickStat sensorId="co" icon={AlertCircle} />
          <QuickStat sensorId="air-quality" icon={Activity} />
        </div>

        {/* Full sensor grid */}
        <GlassCard
          title="Complete Sensor Array"
          subtitle="12 active sensors"
          icon={Flame}
          variant="ember"
        >
          <SensorChipGrid />
        </GlassCard>
      </div>
    </motion.div>
  );
}

/**
 * QuickStat - Compact stat display
 */
function QuickStat({ sensorId, icon: Icon }) {
  const sensor = useSensorStore((state) => state.sensors[sensorId]);

  if (!sensor) return null;

  const statusColor =
    sensor.status === 'critical'
      ? 'text-strobe-red'
      : sensor.status === 'warning'
        ? 'text-warning-yellow'
        : 'text-deep-amber';

  return (
    <GlassPanel variant="minimal" className="p-3" animated={false}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-burnt-orange/10 flex items-center justify-center">
          <Icon className="text-burnt-orange" size={18} />
        </div>
        <div>
          <p className="text-xs text-dim-grey uppercase">{sensor.label}</p>
          <p className={`font-rajdhani font-bold text-lg ${statusColor}`}>
            {sensor.value.toFixed(1)}
            <span className="text-xs text-dim-grey ml-1">{sensor.unit}</span>
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}

/**
 * SystemStatusCard - Overall system health display
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
      variant={systemStatus === 'critical' ? 'critical' : 'ember'}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            ${
              systemStatus === 'critical'
                ? 'bg-strobe-red/20'
                : systemStatus === 'warning'
                  ? 'bg-warning-yellow/20'
                  : 'bg-emerald-400/20'
            }
          `}
          animate={
            systemStatus === 'critical'
              ? { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }
              : {}
          }
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <StatusIcon
            size={32}
            className={
              systemStatus === 'critical'
                ? 'text-strobe-red'
                : systemStatus === 'warning'
                  ? 'text-warning-yellow'
                  : 'text-emerald-400'
            }
          />
        </motion.div>
        <div>
          <p
            className={`
              font-rajdhani font-bold text-2xl uppercase
              ${
                systemStatus === 'critical'
                  ? 'text-strobe-red'
                  : systemStatus === 'warning'
                    ? 'text-warning-yellow'
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
    amber: 'text-warning-yellow bg-warning-yellow/10',
    red: 'text-strobe-red bg-strobe-red/10',
  };

  return (
    <div className={`p-3 rounded-lg text-center ${colors[color]}`}>
      <p className="text-2xl font-rajdhani font-bold">{count}</p>
      <p className="text-xs uppercase opacity-70">{label}</p>
    </div>
  );
}

/**
 * PlaceholderPage - Coming soon pages
 */
function PlaceholderPage({ title, icon: Icon }) {
  return (
    <motion.div
      className="h-full pt-20 pb-32 px-4 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <GlassPanel variant="ember" className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-burnt-orange/10 flex items-center justify-center">
          <Icon className="text-burnt-orange" size={32} />
        </div>
        <h2 className="font-rajdhani font-bold text-xl text-white mb-2">
          {title}
        </h2>
        <p className="text-dim-grey">This feature is coming soon...</p>
      </GlassPanel>
    </motion.div>
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
    <div className="h-screen w-screen overflow-hidden bg-phantom-black">
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

          {/* Top header */}
          <TopHeader />

          {/* Bottom navigation */}
          <BottomNavigation />
          <MiniStatusBar />

          {/* Page content */}
          <main className="relative z-10 h-full">
            <AnimatePresence mode="wait">
              {activePage === 'dashboard' && (
                <DashboardPage key="dashboard" />
              )}
              {activePage === 'sensors' && <SensorsPage key="sensors" />}
              {activePage === 'analytics' && (
                <PlaceholderPage
                  key="analytics"
                  title="Analytics"
                  icon={Activity}
                />
              )}
              {activePage === 'alerts' && (
                <PlaceholderPage
                  key="alerts"
                  title="Alert History"
                  icon={AlertCircle}
                />
              )}
              {activePage === 'settings' && (
                <PlaceholderPage
                  key="settings"
                  title="Settings"
                  icon={Shield}
                />
              )}
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}
