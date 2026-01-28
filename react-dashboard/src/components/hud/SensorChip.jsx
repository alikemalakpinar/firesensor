import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Activity,
  AlertTriangle,
  Skull,
  Cloud,
  Leaf,
  Flame,
  Gauge,
  Zap,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useSensorStore } from '../../stores/useSensorStore';

// Icon mapping for sensors
const SENSOR_ICONS = {
  temperature: Thermometer,
  humidity: Droplets,
  gas: Wind,
  'air-quality': Activity,
  no2: AlertTriangle,
  co: Skull,
  tvoc: Cloud,
  eco2: Leaf,
  'surface-temp': Flame,
  'surface-temp-2': Flame,
  pressure: Gauge,
  current: Zap,
};

/**
 * SensorChip - A compact sensor display that expands on interaction
 *
 * Normal state: Small chip with icon, value, and status indicator
 * Expanded state: Full card with history chart and details
 */
export function SensorChip({ sensorId, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sensor = useSensorStore((state) => state.sensors[sensorId]);
  const selectSensor = useSensorStore((state) => state.selectSensor);
  const setCameraTarget = useSensorStore((state) => state.setCameraTarget);

  if (!sensor) return null;

  const Icon = SENSOR_ICONS[sensorId] || Activity;

  // Magma & Obsidian color scheme
  const statusColors = {
    normal: {
      bg: 'bg-burnt-orange/10',
      border: 'border-burnt-orange/30',
      text: 'text-deep-amber',
      glow: 'shadow-burnt-orange/20',
    },
    warning: {
      bg: 'bg-warning-yellow/10',
      border: 'border-warning-yellow/30',
      text: 'text-warning-yellow',
      glow: 'shadow-warning-yellow/20',
    },
    critical: {
      bg: 'bg-strobe-red/10',
      border: 'border-strobe-red/30',
      text: 'text-strobe-red',
      glow: 'shadow-strobe-red/30',
    },
    offline: {
      bg: 'bg-warm-grey/10',
      border: 'border-warm-grey/30',
      text: 'text-warm-grey',
      glow: '',
    },
  };

  const colors = statusColors[sensor.status] || statusColors.normal;

  const TrendIcon =
    sensor.trend === 'rising'
      ? TrendingUp
      : sensor.trend === 'falling'
        ? TrendingDown
        : Minus;

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    selectSensor(isExpanded ? null : sensorId);
    setCameraTarget(isExpanded ? null : sensorId);
    onClick?.(sensorId);
  };

  return (
    <motion.div
      layout
      className={`
        relative rounded-xl overflow-hidden
        backdrop-blur-xl border transition-all duration-300
        ${colors.bg} ${colors.border}
        ${isExpanded ? 'shadow-lg' : ''}
        ${sensor.status === 'critical' ? `shadow-lg ${colors.glow}` : ''}
        cursor-pointer
      `}
      onClick={handleClick}
      animate={
        sensor.status === 'critical' && !isExpanded
          ? { scale: [1, 1.02, 1] }
          : {}
      }
      transition={
        sensor.status === 'critical'
          ? { repeat: Infinity, duration: 1 }
          : { duration: 0.2 }
      }
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Collapsed chip view */}
      <motion.div
        className="relative z-10 p-3 flex items-center gap-3"
        layout
      >
        {/* Icon */}
        <div
          className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${colors.bg} ${colors.text}
          `}
        >
          <Icon size={20} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-sm font-medium truncate">
              {sensor.label}
            </span>
            {sensor.status === 'critical' && (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-strobe-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-strobe-red"></span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-rajdhani font-bold ${colors.text}`}>
              {sensor.value.toFixed(1)}
            </span>
            <span className="text-white/40 text-xs">{sensor.unit}</span>
            <TrendIcon
              size={12}
              className={
                sensor.trend === 'rising'
                  ? 'text-burnt-orange'
                  : sensor.trend === 'falling'
                    ? 'text-dim-grey'
                    : 'text-white/30'
              }
            />
          </div>
        </div>

        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-white/30"
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10"
          >
            <div className="p-3 space-y-3">
              {/* Mini sparkline */}
              <MiniSparkline data={sensor.history} status={sensor.status} />

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <StatItem label="MIN" value={sensor.min} unit={sensor.unit} />
                <StatItem label="CURRENT" value={sensor.value.toFixed(1)} unit={sensor.unit} highlight />
                <StatItem label="MAX" value={sensor.max} unit={sensor.unit} />
              </div>

              {/* Floor indicator */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">
                  Position: Floor {sensor.position?.floor ?? 0}
                </span>
                <span className={`uppercase font-medium ${colors.text}`}>
                  {sensor.status}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * MiniSparkline - Compact line chart for sensor history
 */
function MiniSparkline({ data, status }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-12 flex items-center justify-center text-white/20 text-xs">
        Collecting data...
      </div>
    );
  }

  const width = 180;
  const height = 48;
  const padding = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const xStep = (width - padding * 2) / (data.length - 1);

  const points = data
    .map((value, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Ember theme sparkline colors
  const strokeColor =
    status === 'critical'
      ? '#FF0000'  // Strobe red
      : status === 'warning'
        ? '#FFBA08'  // Warning yellow
        : '#FF8C00'; // Deep amber

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-12"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`mini-grad-${status}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((y) => (
        <line
          key={y}
          x1={padding}
          y1={height * y}
          x2={width - padding}
          y2={height * y}
          stroke="white"
          strokeOpacity="0.05"
          strokeDasharray="2,2"
        />
      ))}

      {/* Fill */}
      <polygon
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
        fill={`url(#mini-grad-${status})`}
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current value dot */}
      {data.length > 0 && (
        <circle
          cx={width - padding}
          cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
          r="3"
          fill={strokeColor}
        />
      )}
    </svg>
  );
}

/**
 * StatItem - Small stat display
 */
function StatItem({ label, value, unit, highlight = false }) {
  return (
    <div className="text-center">
      <div className="text-white/40 text-[10px] uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`font-mono text-sm ${
          highlight ? 'text-deep-amber' : 'text-white/70'
        }`}
      >
        {value}
        <span className="text-[10px] text-white/30 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

/**
 * SensorChipGrid - Grid layout for multiple sensor chips
 */
export function SensorChipGrid({ className = '' }) {
  const sensors = useSensorStore((state) => state.sensors);

  return (
    <div className={`grid grid-cols-1 gap-2 ${className}`}>
      {Object.keys(sensors).map((id) => (
        <SensorChip key={id} sensorId={id} />
      ))}
    </div>
  );
}

export default SensorChip;
