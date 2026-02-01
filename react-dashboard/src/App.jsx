import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { DigitalTwin } from './components/3d/DigitalTwin';
import { BottomNavigation, MiniStatusBar } from './components/hud/BottomNavigation';
import { Vignette, AlertBanner } from './components/hud/Vignette';
import { TachometerGauge, SystemHealthGauge } from './components/hud/TachometerGauge';
import { SensorChip, SensorChipGrid } from './components/hud/SensorChip';
import GlassPanel, { GlassCard } from './components/ui/GlassPanel';

import { useMQTTSimulator } from './hooks/useMQTT';
import { useSensorStore } from './stores/useSensorStore';

import {
  Activity, Shield, AlertCircle, CheckCircle, Flame, Zap,
  Thermometer, Wind, Search, MapPin, ChevronRight, ArrowUpRight,
  Droplets, TrendingUp, Clock, Eye, Building2, Cpu, BarChart3, Bell,
} from 'lucide-react';

import './index.css';

/* ────────────────────── Boot Sequence ────────────────────── */
function BootSequence({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); setTimeout(onComplete, 300); return 100; }
        return prev + 3;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-page-bg flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center max-w-sm px-8">
        <motion.div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-text-primary flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <Flame className="text-white" size={28} />
        </motion.div>
        <h1 className="font-display font-bold text-2xl text-text-primary mb-1">FIRELINK</h1>
        <p className="text-text-tertiary text-sm mb-8">Detection System</p>
        <div className="relative h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-text-tertiary text-xs mt-4">{progress.toFixed(0)}%</p>
      </div>
    </motion.div>
  );
}

/* ────────────────────── Top Header ────────────────────── */
function TopHeader() {
  const activePage = useSensorStore((s) => s.activePage);
  const activeDeviceId = useSensorStore((s) => s.activeDeviceId);
  const devices = useSensorStore((s) => s.devices);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeDevice = devices.find((d) => d.id === activeDeviceId);
  const pageNames = { dashboard: 'Overview', sensors: 'Sensors', analytics: 'Analytics', alerts: 'Alerts', settings: 'Settings' };

  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-sidebar-bg/50">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-tertiary">FIRELINK</span>
        <ChevronRight size={14} className="text-text-tertiary" />
        <span className="text-text-tertiary">{activeDevice?.name || 'Device'}</span>
        <ChevronRight size={14} className="text-text-tertiary" />
        <span className="text-text-primary font-medium">{pageNames[activePage]}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-border rounded-xl text-sm text-text-tertiary w-64 cursor-pointer hover:border-primary/30 transition-colors">
          <Search size={16} />
          <span>Search sensors...</span>
        </div>
        <MiniStatusBar />
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card-bg border border-border rounded-xl">
          <Clock size={14} className="text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary">
            {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────── Bar Chart Component ────────────────────── */
function BarChart({ data, labels, color = '#2D7A6F', height = 140, highlightIndex = null }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((value, i) => {
        const barHeight = (value / max) * 100;
        const isHighlight = i === highlightIndex;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full relative flex items-end" style={{ height: height - 20 }}>
              {isHighlight && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap"
                  style={{ backgroundColor: color + '15', color }}>
                  {value.toFixed(1)}
                </div>
              )}
              <motion.div
                className="w-full rounded-t-md"
                style={{ backgroundColor: isHighlight ? color : color + '30' }}
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
              />
            </div>
            {labels?.[i] && (
              <span className={`text-[10px] ${isHighlight ? 'font-semibold text-text-primary' : 'text-text-tertiary'}`}>
                {labels[i]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────── Sparkline ────────────────────── */
function Sparkline({ data, color = '#2D7A6F', width = 120, height = 40 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const xStep = (width - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => `${pad + i * xStep},${height - pad - ((v - min) / range) * (height - pad * 2)}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${height - pad} ${points} ${width - pad},${height - pad}`} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width - pad} cy={height - pad - ((data[data.length - 1] - min) / range) * (height - pad * 2)} r="2.5" fill={color} />
    </svg>
  );
}

/* ────────────────────── Large Metric Card ────────────────────── */
function MetricCard({ sensorId, icon: Icon, accentColor, large = false }) {
  const sensor = useSensorStore((s) => s.deviceSensors[s.activeDeviceId]?.[sensorId]);
  if (!sensor) return null;

  const change = sensor.history.length >= 2
    ? ((sensor.value - sensor.history[sensor.history.length - 2]) / (sensor.history[sensor.history.length - 2] || 1) * 100)
    : 0;

  return (
    <motion.div
      className={`bg-card-bg border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${large ? 'col-span-2' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor + '15', color: accentColor }}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{sensor.label}</p>
            <p className="text-[11px] text-text-tertiary">{sensor.status === 'critical' ? 'CRITICAL' : 'Live data'}</p>
          </div>
        </div>
        <Sparkline data={sensor.history.slice(-20)} color={accentColor} width={80} height={32} />
      </div>
      <div className="flex items-baseline gap-2">
        <motion.span
          className="font-display font-bold text-4xl"
          style={{ color: sensor.status === 'critical' ? '#DC2626' : '#1A1A1A' }}
          key={Math.round(sensor.value * 10)}
          initial={{ y: -4, opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {sensor.value.toFixed(1)}
        </motion.span>
        <span className="text-sm text-text-tertiary">{sensor.unit}</span>
        {change !== 0 && (
          <span className={`text-xs font-medium ml-auto px-2 py-0.5 rounded-full ${
            change > 0 ? 'text-accent bg-accent-light' : 'text-primary bg-primary-lighter'
          }`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ────────────────────── Dashboard Page ────────────────────── */
function DashboardPage() {
  const activeDeviceId = useSensorStore((s) => s.activeDeviceId);
  const devices = useSensorStore((s) => s.devices);
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});
  const activeDevice = devices.find((d) => d.id === activeDeviceId);

  const tempSensor = sensors.temperature;
  const barData = useMemo(() => {
    if (!tempSensor?.history || tempSensor.history.length < 2) return { data: [], labels: [] };
    const h = tempSensor.history.slice(-7);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return { data: h, labels: days.slice(0, h.length) };
  }, [tempSensor?.history]);

  return (
    <motion.div className="h-full p-6 overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="max-w-[1400px] space-y-5">

        {/* Device Info Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl text-text-primary">{activeDevice?.name || 'Dashboard'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={13} className="text-text-tertiary" />
              <span className="text-sm text-text-tertiary">{activeDevice?.location}</span>
              <span className="w-1 h-1 rounded-full bg-text-tertiary" />
              <span className="text-sm text-text-tertiary">{activeDevice?.sensorCount} sensors</span>
              <span className="w-1 h-1 rounded-full bg-text-tertiary" />
              <span className="text-sm text-text-tertiary">{activeDevice?.floors} floor{activeDevice?.floors !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-primary-lighter text-primary text-xs font-medium flex items-center gap-1.5">
              <Eye size={12} />
              Live
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">

          {/* ── Left: 3D + Bar Chart ── */}
          <div className="col-span-8 space-y-5">

            {/* 3D Digital Twin */}
            <div className="bg-card-bg border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-lighter flex items-center justify-center text-primary">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-xl text-text-primary flex items-center gap-2">
                      Digital Twin
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                      </span>
                    </h2>
                    <p className="text-xs text-text-tertiary">3D facility monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-surface border border-border text-xs text-text-secondary">{activeDevice?.floors} Floor{activeDevice?.floors !== 1 ? 's' : ''}</span>
                  <span className="px-3 py-1 rounded-lg bg-surface border border-border text-xs text-text-secondary">{activeDevice?.sensorCount} Nodes</span>
                </div>
              </div>
              <div className="h-[380px]">
                <DigitalTwin />
              </div>
            </div>

            {/* Temperature Bar Chart + Metrics Row */}
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2 bg-card-bg border border-border rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-display font-bold text-xl text-text-primary">Temperature</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">Recent readings</p>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-surface border border-border text-xs text-text-secondary">this week</span>
                </div>
                <BarChart
                  data={barData.data}
                  labels={barData.labels}
                  color="#2D7A6F"
                  height={130}
                  highlightIndex={barData.data.length - 1}
                />
                {tempSensor && (
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="font-display font-bold text-2xl text-text-primary">{tempSensor.value.toFixed(1)}°C</span>
                    <span className="text-xs text-text-tertiary">current reading</span>
                  </div>
                )}
              </div>

              {/* System Health */}
              <SystemStatusCard />
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="col-span-4 space-y-5">

            {/* Key Metrics */}
            <MetricCard sensorId="temperature" icon={Thermometer} accentColor="#2D7A6F" />
            <MetricCard sensorId="co" icon={AlertCircle} accentColor="#DC2626" />
            <MetricCard sensorId="humidity" icon={Droplets} accentColor="#0891B2" />

            {/* Quick Sensors */}
            <GlassCard title="Active Sensors" subtitle="Real-time" icon={Zap}
              headerRight={
                <span className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1">
                  View All <ArrowUpRight size={12} />
                </span>
              }
            >
              <div className="space-y-2">
                {['gas', 'no2', 'tvoc', 'eco2'].map((id) => (
                  <SensorChip key={id} sensorId={id} />
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ────────────────────── System Status Card ────────────────────── */
function SystemStatusCard() {
  const systemStatus = useSensorStore((s) => s.systemStatus);
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});

  const criticalCount = Object.values(sensors).filter((s) => s.status === 'critical').length;
  const warningCount = Object.values(sensors).filter((s) => s.status === 'warning').length;
  const normalCount = Object.values(sensors).filter((s) => s.status === 'normal').length;

  const StatusIcon = systemStatus === 'critical' ? AlertCircle : CheckCircle;
  const statusColor = systemStatus === 'critical' ? '#DC2626' : systemStatus === 'warning' ? '#D97706' : '#16A34A';

  return (
    <div className={`bg-card-bg border rounded-2xl p-5 shadow-sm flex flex-col ${
      systemStatus === 'critical' ? 'border-danger/30' : 'border-border'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: statusColor + '15' }}>
          <StatusIcon size={20} style={{ color: statusColor }} />
        </div>
        <div>
          <p className="font-display font-bold text-base uppercase" style={{ color: statusColor }}>{systemStatus}</p>
          <p className="text-[11px] text-text-tertiary">System health</p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 mt-auto">
        <StatusBar label="Normal" count={normalCount} total={12} color="#16A34A" />
        <StatusBar label="Warning" count={warningCount} total={12} color="#D97706" />
        <StatusBar label="Critical" count={criticalCount} total={12} color="#DC2626" />
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, color }) {
  const pct = (count / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-text-tertiary">{label}</span>
        <span className="text-[11px] font-medium" style={{ color }}>{count}</span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ────────────────────── Sensors Page ────────────────────── */
function SensorsPage() {
  const activeDevice = useSensorStore((s) => s.devices.find((d) => d.id === s.activeDeviceId));

  return (
    <motion.div className="h-full p-6 overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-text-primary">All Sensors</h2>
            <p className="text-sm text-text-tertiary mt-0.5">{activeDevice?.name} - {activeDevice?.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <QuickStat sensorId="temperature" icon={Thermometer} color="#2D7A6F" />
          <QuickStat sensorId="humidity" icon={Droplets} color="#0891B2" />
          <QuickStat sensorId="co" icon={AlertCircle} color="#DC2626" />
          <QuickStat sensorId="air-quality" icon={Activity} color="#8B5CF6" />
        </div>

        <div className="bg-card-bg border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-text-primary">Complete Sensor Array</h3>
            <span className="text-xs text-text-tertiary">12 active sensors</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SensorChipGrid />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickStat({ sensorId, icon: Icon, color }) {
  const sensor = useSensorStore((s) => s.deviceSensors[s.activeDeviceId]?.[sensorId]);
  if (!sensor) return null;

  return (
    <motion.div
      className="bg-card-bg border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15', color }}>
          <Icon size={16} />
        </div>
        <Sparkline data={sensor.history.slice(-15)} color={color} width={60} height={24} />
      </div>
      <p className="text-xs text-text-tertiary mb-0.5">{sensor.label}</p>
      <p className="font-display font-bold text-xl text-text-primary">
        {sensor.value.toFixed(1)}
        <span className="text-xs text-text-tertiary ml-1 font-normal">{sensor.unit}</span>
      </p>
    </motion.div>
  );
}

/* ────────────────────── Placeholder Page ────────────────────── */
function PlaceholderPage({ title, icon: Icon }) {
  return (
    <motion.div className="h-full p-6 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <GlassPanel className="p-10 text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary-lighter flex items-center justify-center text-primary">
          <Icon size={28} />
        </div>
        <h2 className="font-display font-bold text-xl text-text-primary mb-2">{title}</h2>
        <p className="text-text-tertiary text-sm">This feature is coming soon...</p>
      </GlassPanel>
    </motion.div>
  );
}

/* ────────────────────── App ────────────────────── */
export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const activePage = useSensorStore((s) => s.activePage);

  useMQTTSimulator();

  return (
    <div className="h-screen w-screen overflow-hidden bg-page-bg flex">
      <AnimatePresence>
        {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}
      </AnimatePresence>

      {!isBooting && (
        <>
          <BottomNavigation />
          <Vignette />
          <AlertBanner />

          <div className="flex-1 ml-[72px] flex flex-col h-full">
            <TopHeader />
            <main className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activePage === 'dashboard' && <DashboardPage key="dashboard" />}
                {activePage === 'sensors' && <SensorsPage key="sensors" />}
                {activePage === 'analytics' && <PlaceholderPage key="analytics" title="Analytics" icon={BarChart3} />}
                {activePage === 'alerts' && <PlaceholderPage key="alerts" title="Alert History" icon={Bell} />}
                {activePage === 'settings' && <PlaceholderPage key="settings" title="Settings" icon={Shield} />}
              </AnimatePresence>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
