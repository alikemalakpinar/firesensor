import { useEffect, useState } from 'react';
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
  Activity, Shield, Clock, AlertCircle, CheckCircle, Flame, Zap,
  Thermometer, Wind, Search, MapPin, ChevronRight,
} from 'lucide-react';

import './index.css';

/**
 * BootSequence - Clean loading animation
 */
function BootSequence({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
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
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-text-primary flex items-center justify-center">
          <Flame className="text-white" size={28} />
        </div>
        <h1 className="font-display font-bold text-2xl text-text-primary mb-1">
          FIRELINK
        </h1>
        <p className="text-text-tertiary text-sm mb-8">Detection System</p>
        <div className="relative h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-text-tertiary text-xs mt-4">{progress.toFixed(0)}%</p>
      </div>
    </motion.div>
  );
}

/**
 * TopHeader - Breadcrumb + search + status
 */
function TopHeader() {
  const activePage = useSensorStore((state) => state.activePage);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pageNames = {
    dashboard: 'Overview',
    sensors: 'Sensors',
    analytics: 'Analytics',
    alerts: 'Alerts',
    settings: 'Settings',
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-sidebar-bg/50">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-tertiary">FIRELINK</span>
        <ChevronRight size={14} className="text-text-tertiary" />
        <span className="text-text-tertiary">Dashboard</span>
        <ChevronRight size={14} className="text-text-tertiary" />
        <span className="text-text-primary font-medium">{pageNames[activePage]}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-border rounded-xl text-sm text-text-tertiary w-64">
          <Search size={16} />
          <span>Search sensors...</span>
        </div>

        {/* Status */}
        <MiniStatusBar />

        {/* Time */}
        <div className="text-right">
          <p className="text-sm font-medium text-text-primary">
            {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] text-text-tertiary">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardPage
 */
function DashboardPage() {
  return (
    <motion.div
      className="h-full p-6 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="grid grid-cols-12 gap-5 max-w-[1400px]">
        {/* Main 3D view card */}
        <div className="col-span-8">
          <GlassPanel className="p-0 overflow-hidden" size="lg">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-lighter flex items-center justify-center text-primary">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-text-primary">Digital Twin</h2>
                  <p className="text-xs text-text-tertiary">3D facility visualization</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-surface border border-border text-xs text-text-secondary">
                  3 Floors
                </span>
                <span className="px-3 py-1 rounded-lg bg-surface border border-border text-xs text-text-secondary">
                  12 Sensors
                </span>
              </div>
            </div>
            <div className="h-[360px] rounded-b-2xl overflow-hidden">
              <DigitalTwin />
            </div>
          </GlassPanel>
        </div>

        {/* Right column - Gauges */}
        <div className="col-span-4 space-y-5">
          <GlassCard title="Key Metrics" subtitle="Real-time values" icon={Activity}>
            <div className="grid grid-cols-2 gap-4">
              <TachometerGauge sensorId="temperature" title="Temperature" size={120} />
              <TachometerGauge sensorId="co" title="CO" size={120} />
              <TachometerGauge sensorId="humidity" title="Humidity" size={120} />
              <SystemHealthGauge size={120} />
            </div>
          </GlassCard>
        </div>

        {/* Sensor Overview */}
        <div className="col-span-8">
          <GlassCard title="Sensor Overview" subtitle="All active sensors" icon={Zap}>
            <div className="grid grid-cols-2 gap-3">
              {['gas', 'no2', 'tvoc', 'eco2', 'surface-temp', 'pressure'].map((id) => (
                <SensorChip key={id} sensorId={id} />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* System Status */}
        <div className="col-span-4">
          <SystemStatusCard />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * SensorsPage
 */
function SensorsPage() {
  return (
    <motion.div
      className="h-full p-6 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-4xl">
        <h2 className="font-display font-bold text-2xl text-text-primary mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-lighter flex items-center justify-center text-primary">
            <Zap size={18} />
          </div>
          All Sensors
        </h2>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <QuickStat sensorId="temperature" icon={Thermometer} />
          <QuickStat sensorId="humidity" icon={Wind} />
          <QuickStat sensorId="co" icon={AlertCircle} />
          <QuickStat sensorId="air-quality" icon={Activity} />
        </div>

        <GlassCard title="Complete Sensor Array" subtitle="12 active sensors" icon={Activity}>
          <SensorChipGrid />
        </GlassCard>
      </div>
    </motion.div>
  );
}

function QuickStat({ sensorId, icon: Icon }) {
  const sensor = useSensorStore((state) => state.sensors[sensorId]);
  if (!sensor) return null;

  const statusColor =
    sensor.status === 'critical' ? 'text-danger'
    : sensor.status === 'warning' ? 'text-warning'
    : 'text-text-primary';

  return (
    <GlassPanel variant="minimal" className="p-4" animated={false}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-lighter flex items-center justify-center text-primary">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-text-tertiary">{sensor.label}</p>
          <p className={`font-display font-bold text-lg ${statusColor}`}>
            {sensor.value.toFixed(1)}
            <span className="text-xs text-text-tertiary ml-1">{sensor.unit}</span>
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}

function SystemStatusCard() {
  const systemStatus = useSensorStore((state) => state.systemStatus);
  const sensors = useSensorStore((state) => state.sensors);

  const criticalCount = Object.values(sensors).filter((s) => s.status === 'critical').length;
  const warningCount = Object.values(sensors).filter((s) => s.status === 'warning').length;
  const normalCount = Object.values(sensors).filter((s) => s.status === 'normal').length;

  const StatusIcon = systemStatus === 'critical' ? AlertCircle : CheckCircle;

  return (
    <GlassCard
      title="System Status"
      subtitle="Overall health"
      icon={Shield}
      variant={systemStatus === 'critical' ? 'critical' : 'default'}
    >
      <div className="flex items-center gap-4 mb-5">
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center
          ${systemStatus === 'critical' ? 'bg-danger-light' : systemStatus === 'warning' ? 'bg-warning-light' : 'bg-success-light'}
        `}>
          <StatusIcon
            size={28}
            className={
              systemStatus === 'critical' ? 'text-danger'
              : systemStatus === 'warning' ? 'text-warning'
              : 'text-success'
            }
          />
        </div>
        <div>
          <p className={`
            font-display font-bold text-xl uppercase
            ${systemStatus === 'critical' ? 'text-danger' : systemStatus === 'warning' ? 'text-warning' : 'text-success'}
          `}>
            {systemStatus}
          </p>
          <p className="text-text-tertiary text-sm">Operational status</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatusCount label="Normal" count={normalCount} color="success" />
        <StatusCount label="Warning" count={warningCount} color="warning" />
        <StatusCount label="Critical" count={criticalCount} color="danger" />
      </div>
    </GlassCard>
  );
}

function StatusCount({ label, count, color }) {
  const colors = {
    success: 'text-success bg-success-light',
    warning: 'text-warning bg-warning-light',
    danger: 'text-danger bg-danger-light',
  };

  return (
    <div className={`p-3 rounded-xl text-center ${colors[color]}`}>
      <p className="text-2xl font-display font-bold">{count}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

function PlaceholderPage({ title, icon: Icon }) {
  return (
    <motion.div
      className="h-full p-6 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
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

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const activePage = useSensorStore((state) => state.activePage);
  const setCameraTarget = useSensorStore((state) => state.setCameraTarget);

  useMQTTSimulator();

  return (
    <div className="h-screen w-screen overflow-hidden bg-page-bg flex">
      <AnimatePresence>
        {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}
      </AnimatePresence>

      {!isBooting && (
        <>
          {/* Left Sidebar */}
          <BottomNavigation />

          {/* Vignette overlay */}
          <Vignette />
          <AlertBanner />

          {/* Main content */}
          <div className="flex-1 ml-[72px] flex flex-col h-full">
            <TopHeader />
            <main className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activePage === 'dashboard' && <DashboardPage key="dashboard" />}
                {activePage === 'sensors' && <SensorsPage key="sensors" />}
                {activePage === 'analytics' && <PlaceholderPage key="analytics" title="Analytics" icon={Activity} />}
                {activePage === 'alerts' && <PlaceholderPage key="alerts" title="Alert History" icon={AlertCircle} />}
                {activePage === 'settings' && <PlaceholderPage key="settings" title="Settings" icon={Shield} />}
              </AnimatePresence>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
