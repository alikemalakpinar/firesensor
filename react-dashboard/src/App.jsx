import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { DigitalTwin } from './components/3d/DigitalTwin';
import { BottomNavigation, MiniStatusBar } from './components/hud/BottomNavigation';
import { Vignette, AlertBanner } from './components/hud/Vignette';
import { TachometerGauge, SystemHealthGauge } from './components/hud/TachometerGauge';
import { SensorChip, SensorChipGrid } from './components/hud/SensorChip';
import GlassPanel, { GlassCard } from './components/ui/GlassPanel';

import { useMQTTSimulator } from './hooks/useMQTT';
import { useSensorStore, SENSOR_CONFIG } from './stores/useSensorStore';

import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';

import {
  Activity, Shield, AlertCircle, CheckCircle, Flame, Zap,
  Thermometer, Wind, Search, MapPin, ChevronRight, ArrowUpRight,
  Droplets, TrendingUp, TrendingDown, Clock, Eye, Building2,
  Cpu, BarChart3, Bell, ChevronDown, Minus, Gauge, Leaf,
  Cloud, Skull, AlertTriangle, Radio,
} from 'lucide-react';

import './index.css';

/* ═══════════════════════ Animations ═══════════════════════ */
const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } },
  item: { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } },
};

/* ═══════════════════════ Boot Sequence ═══════════════════════ */
function BootSequence({ onComplete }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => { if (p >= 100) { clearInterval(interval); setTimeout(onComplete, 300); return 100; } return p + 4; });
    }, 35);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div className="fixed inset-0 z-[200] bg-page-bg flex items-center justify-center" exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <div className="text-center max-w-sm px-8">
        <motion.div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-text-primary flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, delay: 0.1 }}>
          <Flame className="text-white" size={28} />
        </motion.div>
        <motion.h1 className="font-display font-bold text-3xl text-text-primary tracking-tight mb-1"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>FIRELINK</motion.h1>
        <motion.p className="text-text-tertiary text-sm mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          Detection System v2.0
        </motion.p>
        <div className="relative h-1 bg-border rounded-full overflow-hidden">
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ Top Header ═══════════════════════ */
function TopHeader() {
  const activePage = useSensorStore((s) => s.activePage);
  const activeDeviceId = useSensorStore((s) => s.activeDeviceId);
  const devices = useSensorStore((s) => s.devices);
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(t); }, []);
  const activeDevice = devices.find((d) => d.id === activeDeviceId);
  const pageNames = { dashboard: 'Overview', sensors: 'Sensors', analytics: 'Analytics', alerts: 'Alerts', settings: 'Settings' };

  return (
    <div className="flex items-center justify-between px-7 py-3 border-b border-border bg-card-bg/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-text-tertiary font-medium">FIRELINK</span>
        <ChevronRight size={12} className="text-text-tertiary/50" />
        <span className="text-text-tertiary">{activeDevice?.name || 'Device'}</span>
        <ChevronRight size={12} className="text-text-tertiary/50" />
        <span className="text-text-primary font-semibold">{pageNames[activePage]}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2 bg-surface border border-border rounded-xl text-[13px] text-text-tertiary w-60 cursor-pointer hover:border-primary/30 transition-colors">
          <Search size={15} className="text-text-tertiary/70" />
          <span>Search by sensor or name</span>
        </div>
        <MiniStatusBar />
        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl">
          <Clock size={13} className="text-text-tertiary" />
          <span className="text-[13px] font-medium text-text-primary tabular-nums">
            {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ SVG Sparkline ═══════════════════════ */
function Sparkline({ data, color = '#2D7A6F', width = 120, height = 40, filled = true }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const pad = 2; const xStep = (width - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => `${pad + i * xStep},${height - pad - ((v - min) / range) * (height - pad * 2)}`).join(' ');
  const uid = `sp-${color.replace('#', '')}-${data.length}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {filled && (
        <>
          <defs><linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.12" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <polygon points={`${pad},${height - pad} ${pts} ${width - pad},${height - pad}`} fill={`url(#${uid})`} />
        </>
      )}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width - pad} cy={height - pad - ((data[data.length - 1] - min) / range) * (height - pad * 2)} r="2.5" fill={color} />
    </svg>
  );
}

/* ═══════════════════════ Bar Chart ═══════════════════════ */
function BarChart({ data, labels, color = '#2D7A6F', height = 160, highlightIndex = null }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[6px]" style={{ height }}>
      {data.map((value, i) => {
        const barH = (value / max) * 100;
        const hl = i === highlightIndex;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full relative flex items-end" style={{ height: height - 24 }}>
              {hl && (
                <motion.div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-sm"
                  style={{ backgroundColor: color, color: '#fff' }}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  {value.toFixed(1)}
                </motion.div>
              )}
              <motion.div className="w-full rounded-md" style={{ backgroundColor: hl ? color : color + '25' }}
                initial={{ height: 0 }} animate={{ height: `${barH}%` }}
                transition={{ duration: 0.7, delay: i * 0.04, ease: [0.34, 1.56, 0.64, 1] }} />
            </div>
            {labels?.[i] && <span className={`text-[10px] ${hl ? 'font-bold text-text-primary' : 'text-text-tertiary'}`}>{labels[i]}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ Wave Chart (Quality style) ═══════════════════════ */
function WaveChart({ data, color = '#2D7A6F', height = 100 }) {
  if (!data || data.length < 3) return <div style={{ height }} className="flex items-center justify-center text-text-tertiary text-xs">Collecting...</div>;
  const w = 260; const h = height; const pad = 8;
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const xStep = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => ({ x: pad + i * xStep, y: h - pad - ((v - min) / range) * (h - pad * 2) }));

  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const cx = (pts[i].x + pts[i + 1].x) / 2;
    path += ` C ${cx} ${pts[i].y}, ${cx} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
  }

  const uid = `wv-${color.replace('#', '')}`;
  const areaPath = `${path} L ${pts[pts.length - 1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} x1={pad} y1={h * y} x2={w - pad} y2={h * y} stroke="#E5E5E3" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      <path d={areaPath} fill={`url(#${uid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill="white" stroke={color} strokeWidth="2" />
      <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 10}
        textAnchor="middle" fill={color} fontSize="10" fontWeight="700">
        {data[data.length - 1].toFixed(1)}
      </text>
    </svg>
  );
}

/* ═══════════════════════ Dashboard Page ═══════════════════════ */
function DashboardPage() {
  const activeDeviceId = useSensorStore((s) => s.activeDeviceId);
  const devices = useSensorStore((s) => s.devices);
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});
  const systemStatus = useSensorStore((s) => s.systemStatus);
  const panelHealth = useSensorStore((s) => s.panelHealth);
  const activeDevice = devices.find((d) => d.id === activeDeviceId);

  const tempSensor = sensors.temperature;
  const coSensor = sensors.co;
  const humiditySensor = sensors.humidity;
  const aqSensor = sensors['air-quality'];

  const barData = useMemo(() => {
    if (!tempSensor?.history || tempSensor.history.length < 2) return { data: [], labels: [] };
    const h = tempSensor.history.slice(-7);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return { data: h, labels: days.slice(0, h.length) };
  }, [tempSensor?.history]);

  const criticalCount = Object.values(sensors).filter((s) => s.status === 'critical').length;
  const normalCount = Object.values(sensors).filter((s) => s.status === 'normal').length;

  return (
    <motion.div className="h-full p-6 overflow-auto" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={stagger.container}>
      <div className="max-w-[1440px] mx-auto space-y-5">

        {/* ─── Device Header ─── */}
        <motion.div className="flex items-end justify-between" variants={stagger.item}>
          <div>
            <h1 className="font-display font-bold text-[32px] text-text-primary tracking-tight leading-none">{activeDevice?.name || 'Dashboard'}</h1>
            <div className="flex items-center gap-2.5 mt-2">
              <MapPin size={13} className="text-text-tertiary" />
              <span className="text-[13px] text-text-secondary">{activeDevice?.location}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-[13px] text-text-secondary">{activeDevice?.sensorCount} sensors</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="text-[13px] text-text-secondary">{activeDevice?.floors} floor{activeDevice?.floors !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <motion.div className="flex items-center gap-2" variants={stagger.item}>
            <span className="px-3 py-1.5 rounded-full bg-primary-lighter text-primary text-xs font-semibold flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" /></span>
              Live
            </span>
          </motion.div>
        </motion.div>

        {/* ═══════════ ROW 1: Hero + Timeline ═══════════ */}
        <div className="grid grid-cols-12 gap-5">

          {/* ── Hero: Temperature Chart + 3D ── */}
          <motion.div className="col-span-8" variants={stagger.item}>
            <div className="bg-card-bg border border-border rounded-[20px] overflow-hidden shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-primary-lighter flex items-center justify-center text-primary">
                    <Thermometer size={20} />
                  </div>
                  <h2 className="font-display font-bold text-[28px] text-text-primary tracking-tight">Temperature</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-surface border border-border text-xs text-text-secondary font-medium flex items-center gap-1.5">
                    this week <ChevronDown size={12} />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-0">
                {/* Bar chart */}
                <div className="col-span-3 px-6 pb-5 pt-2">
                  {/* Dropdown */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-secondary flex items-center gap-1.5">
                      Sensor: Temperature <ChevronDown size={11} />
                    </span>
                  </div>
                  <BarChart data={barData.data} labels={barData.labels} color="#2D7A6F" height={170} highlightIndex={barData.data.length > 3 ? 3 : barData.data.length - 1} />
                  {tempSensor && (
                    <div className="flex items-baseline gap-2.5 mt-5">
                      <span className="font-display font-bold text-[28px] text-text-primary tracking-tight">
                        {tempSensor.value > 0 ? '+' : ''}{tempSensor.value.toFixed(1)}°C
                      </span>
                      <span className="text-[13px] text-text-tertiary">current reading</span>
                    </div>
                  )}
                </div>

                {/* 3D Digital Twin */}
                <div className="col-span-2 relative">
                  <div className="h-[320px] -mr-2">
                    <DigitalTwin />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Alert Timeline ── */}
          <motion.div className="col-span-4" variants={stagger.item}>
            <div className="bg-card-bg border border-border rounded-[20px] p-5 shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg text-text-primary">Sensor Activity</h3>
                <span className="text-xs text-primary font-semibold cursor-pointer hover:underline flex items-center gap-1">View All <ArrowUpRight size={11} /></span>
              </div>
              <SensorTimeline sensors={sensors} />
            </div>
          </motion.div>
        </div>

        {/* ═══════════ ROW 2: Device Status + Quality + Health ═══════════ */}
        <div className="grid grid-cols-12 gap-5">

          {/* ── Device Status (like Worker Capacity) ── */}
          <motion.div className="col-span-4" variants={stagger.item}>
            <div className="bg-card-bg border border-border rounded-[20px] p-5 shadow-sm h-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg text-text-primary">Device Status</h3>
                <span className="text-xs text-primary font-semibold cursor-pointer hover:underline flex items-center gap-1">View All <ArrowUpRight size={11} /></span>
              </div>
              <div className="space-y-4">
                {devices.map((device) => (
                  <DeviceRow key={device.id} device={device} isActive={device.id === activeDeviceId} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Air Quality (like Quality card) ── */}
          <motion.div className="col-span-4" variants={stagger.item}>
            <div className="bg-card-bg border border-border rounded-[20px] p-5 shadow-sm h-full">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display font-bold text-lg text-text-primary">Air Quality</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                    aqSensor?.status === 'critical' ? 'bg-danger-light text-danger'
                    : aqSensor?.value < 100 ? 'bg-success-light text-success'
                    : 'bg-warning-light text-warning'
                  }`}>
                    {aqSensor?.status === 'critical' ? 'POOR' : aqSensor?.value < 100 ? 'GOOD' : 'MODERATE'}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-[11px] text-text-secondary flex items-center gap-1">IAQ Index <ChevronDown size={10} /></span>
              </div>
              <p className="text-xs text-text-tertiary mb-4">Air quality index, IAQ</p>
              <WaveChart data={aqSensor?.history?.slice(-20)} color="#8B5CF6" height={120} />
            </div>
          </motion.div>

          {/* ── System Health (orange gradient like Total Revenue) ── */}
          <motion.div className="col-span-4" variants={stagger.item}>
            <div className="bg-gradient-to-br from-accent-bg to-orange-400 rounded-[20px] p-5 shadow-sm h-full text-white relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-white" style={{
                    width: 2, height: Math.random() * 40 + 20, left: `${12 + i * 12}%`,
                    bottom: `${Math.random() * 60}%`, opacity: 0.3 + Math.random() * 0.4,
                  }} />
                ))}
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <Shield size={18} className="text-white/80" />
                    <h3 className="font-display font-bold text-lg">System Health</h3>
                  </div>
                </div>
                <p className="text-white/60 text-xs mb-5">Overall system performance</p>

                {/* Mini bar chart */}
                <div className="flex items-end gap-1 h-16 mb-4">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const sensorArr = Object.values(sensors);
                    const s = sensorArr[i];
                    const isOk = s?.status === 'normal';
                    return (
                      <motion.div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: isOk ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)' }}
                        initial={{ height: 0 }} animate={{ height: `${40 + Math.random() * 60}%` }}
                        transition={{ duration: 0.5, delay: i * 0.03 }} />
                    );
                  })}
                </div>

                {/* Health Score badge */}
                <div className="absolute top-5 right-5">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
                    <span className="font-display font-bold text-sm">{panelHealth.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2.5">
                  <span className="font-display font-bold text-[40px] tracking-tight leading-none">{normalCount}/{Object.keys(sensors).length}</span>
                  <span className="text-white/60 text-[13px]">sensors normal</span>
                </div>
                {criticalCount > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="bg-white/20 text-white text-[11px] font-semibold px-2 py-0.5 rounded-md">{criticalCount} critical</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══════════ ROW 3: Key Sensor Cards ═══════════ */}
        <motion.div className="grid grid-cols-4 gap-5" variants={stagger.item}>
          <MetricCard sensorId="co" icon={Skull} accentColor="#DC2626" sensors={sensors} />
          <MetricCard sensorId="humidity" icon={Droplets} accentColor="#0891B2" sensors={sensors} />
          <MetricCard sensorId="eco2" icon={Leaf} accentColor="#16A34A" sensors={sensors} />
          <MetricCard sensorId="tvoc" icon={Cloud} accentColor="#6366F1" sensors={sensors} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ Sensor Timeline ═══════════════════════ */
function SensorTimeline({ sensors }) {
  const sensorArr = Object.values(sensors).filter((s) => s.lastUpdate);
  const sorted = [...sensorArr].sort((a, b) => (b.lastUpdate || 0) - (a.lastUpdate || 0)).slice(0, 6);
  const now = Date.now();

  const ICON_MAP = { temperature: Thermometer, humidity: Droplets, gas: Wind, 'air-quality': Activity,
    no2: AlertTriangle, co: Skull, tvoc: Cloud, eco2: Leaf, 'surface-temp': Flame, 'surface-temp-2': Flame,
    pressure: Gauge, current: Zap };

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border" />

      <div className="space-y-0">
        {sorted.map((sensor, i) => {
          const elapsed = Math.round((now - sensor.lastUpdate) / 1000);
          const timeStr = elapsed < 5 ? 'just now' : `${elapsed}s ago`;
          const Icon = ICON_MAP[sensor.id] || Activity;
          const isCritical = sensor.status === 'critical';

          return (
            <motion.div key={sensor.id} className="relative pl-7 py-2.5 group" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              {/* Dot */}
              <div className={`absolute left-0 top-3.5 w-[15px] h-[15px] rounded-full border-2 ${
                isCritical ? 'bg-danger border-danger/30' : 'bg-card-bg border-border group-hover:border-primary'
              } z-10 transition-colors`}>
                {isCritical && <motion.div className="absolute inset-0 rounded-full bg-danger" animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} />}
              </div>

              <div className={`p-3 rounded-xl border transition-all ${
                isCritical ? 'bg-danger-light/50 border-danger/20' : 'bg-surface/50 border-transparent hover:bg-surface hover:border-border'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className={isCritical ? 'text-danger' : 'text-text-secondary'} />
                    <span className="text-[13px] font-medium text-text-primary">{sensor.label}</span>
                  </div>
                  <span className="text-[11px] text-text-tertiary tabular-nums">{timeStr}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`font-display font-bold text-[15px] ${isCritical ? 'text-danger' : 'text-text-primary'}`}>
                    {sensor.value.toFixed(1)} {sensor.unit}
                  </span>
                  {isCritical && <span className="text-[10px] font-bold text-danger bg-danger-light px-1.5 py-0.5 rounded">ALERT</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ Device Row ═══════════════════════ */
function DeviceRow({ device, isActive }) {
  const setActiveDevice = useSensorStore((s) => s.setActiveDevice);
  const statusColor = device.status === 'critical' ? '#DC2626' : device.status === 'warning' ? '#D97706' : '#16A34A';
  const healthPct = device.status === 'critical' ? 45 : device.status === 'warning' ? 72 : 85 + Math.random() * 10;

  return (
    <button className={`w-full text-left group`} onClick={() => setActiveDevice(device.id)}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: device.color + '15', color: device.color }}>
          <Building2 size={15} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-medium ${isActive ? 'text-primary' : 'text-text-primary'}`}>{device.name}</span>
            <span className="text-[11px] text-text-tertiary">·</span>
            <span className="text-[11px] text-text-tertiary">{device.location}</span>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor + '15', color: statusColor }}>
          {healthPct.toFixed(0)}%
        </span>
      </div>
      {/* Progress dots */}
      <div className="flex items-center gap-[3px] pl-11">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: i < Math.round(healthPct / 100 * 12) ? device.color : '#E5E5E3' }} />
        ))}
      </div>
    </button>
  );
}

/* ═══════════════════════ Metric Card ═══════════════════════ */
function MetricCard({ sensorId, icon: Icon, accentColor, sensors }) {
  const sensor = sensors?.[sensorId];
  if (!sensor) return null;
  const change = sensor.history.length >= 2 ? ((sensor.value - sensor.history[sensor.history.length - 2]) / (sensor.history[sensor.history.length - 2] || 1) * 100) : 0;

  return (
    <motion.div className="bg-card-bg border border-border rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all group" variants={stagger.item}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[12px] flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: accentColor + '12', color: accentColor }}>
            <Icon size={17} />
          </div>
          <div>
            <p className="text-[13px] font-medium text-text-primary">{sensor.label}</p>
            <p className="text-[10px] text-text-tertiary">{sensor.status === 'critical' ? 'CRITICAL' : 'Live'}</p>
          </div>
        </div>
        <Sparkline data={sensor.history.slice(-15)} color={accentColor} width={64} height={28} />
      </div>
      <div className="flex items-baseline gap-2">
        <motion.span className="font-display font-bold text-[28px] tracking-tight" style={{ color: sensor.status === 'critical' ? '#DC2626' : '#1A1A1A' }}
          key={Math.round(sensor.value * 10)} initial={{ y: -3, opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.12 }}>
          {sensor.value.toFixed(1)}
        </motion.span>
        <span className="text-[13px] text-text-tertiary">{sensor.unit}</span>
        {change !== 0 && (
          <span className={`text-[11px] font-semibold ml-auto px-2 py-0.5 rounded-full ${change > 0 ? 'text-accent bg-accent-light' : 'text-primary bg-primary-lighter'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════ Sensors Page ═══════════════════════ */
function SensorsPage() {
  const activeDevice = useSensorStore((s) => s.devices.find((d) => d.id === s.activeDeviceId));
  const sensors = useSensorStore((s) => s.deviceSensors[s.activeDeviceId] || {});

  return (
    <motion.div className="h-full p-6 overflow-auto" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={stagger.container}>
      <div className="max-w-[1200px] mx-auto">
        <motion.div className="flex items-end justify-between mb-6" variants={stagger.item}>
          <div>
            <h2 className="font-display font-bold text-[28px] text-text-primary tracking-tight">All Sensors</h2>
            <p className="text-[13px] text-text-tertiary mt-1">{activeDevice?.name} · {activeDevice?.location} · 12 active sensors</p>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" variants={stagger.item}>
          <QuickStat sensorId="temperature" icon={Thermometer} color="#2D7A6F" sensors={sensors} />
          <QuickStat sensorId="humidity" icon={Droplets} color="#0891B2" sensors={sensors} />
          <QuickStat sensorId="co" icon={Skull} color="#DC2626" sensors={sensors} />
          <QuickStat sensorId="air-quality" icon={Activity} color="#8B5CF6" sensors={sensors} />
        </motion.div>

        <motion.div className="bg-card-bg border border-border rounded-[20px] p-5 shadow-sm" variants={stagger.item}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-lg text-text-primary">Complete Sensor Array</h3>
            <span className="text-xs text-text-tertiary">12 active sensors</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <SensorChipGrid />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function QuickStat({ sensorId, icon: Icon, color, sensors }) {
  const sensor = sensors?.[sensorId];
  if (!sensor) return null;
  return (
    <motion.div className="bg-card-bg border border-border rounded-[18px] p-4 shadow-sm hover:shadow-md transition-all" variants={stagger.item}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-[12px] flex items-center justify-center" style={{ backgroundColor: color + '12', color }}><Icon size={16} /></div>
        <Sparkline data={sensor.history.slice(-12)} color={color} width={56} height={22} />
      </div>
      <p className="text-[11px] text-text-tertiary mb-0.5">{sensor.label}</p>
      <p className="font-display font-bold text-xl text-text-primary tracking-tight">
        {sensor.value.toFixed(1)}<span className="text-[11px] text-text-tertiary ml-1 font-normal">{sensor.unit}</span>
      </p>
    </motion.div>
  );
}

/* ═══════════════════════ App ═══════════════════════ */
export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const activePage = useSensorStore((s) => s.activePage);
  const theme = useSensorStore((s) => s.theme);
  useMQTTSimulator();

  const isDark = theme === 'dark';

  return (
    <div className="h-screen w-screen overflow-hidden bg-page-bg flex">
      <AnimatePresence>{isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}</AnimatePresence>
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
                {activePage === 'analytics' && <AnalyticsPage key="analytics" />}
                {activePage === 'alerts' && <AlertsPage key="alerts" />}
                {activePage === 'settings' && <SettingsPage key="settings" />}
              </AnimatePresence>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
