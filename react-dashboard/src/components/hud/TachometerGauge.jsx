import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * TachometerGauge - Circular gauge like a car tachometer
 *
 * "Magma & Obsidian" aesthetic:
 * - Gradient arc from amber to red
 * - Glowing needle
 * - Industrial tick marks
 */
export function TachometerGauge({
  sensorId,
  title,
  size = 200,
  className = '',
}) {
  const sensor = useSensorStore((state) => state.sensors[sensorId]);

  if (!sensor) return null;

  const { value, min, max, unit, status, label } = sensor;

  // Calculate percentage and angle
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const startAngle = 135; // Start at bottom-left
  const endAngle = 405; // End at bottom-right (270° sweep)
  const sweepAngle = endAngle - startAngle;
  const currentAngle = startAngle + percentage * sweepAngle;

  // SVG calculations
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.06;

  // Arc path calculation
  const polarToCartesian = (angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (startAng, endAng) => {
    const start = polarToCartesian(endAng);
    const end = polarToCartesian(startAng);
    const largeArcFlag = endAng - startAng <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  // Generate tick marks
  const ticks = useMemo(() => {
    const tickCount = 10;
    const result = [];
    for (let i = 0; i <= tickCount; i++) {
      const angle = startAngle + (i / tickCount) * sweepAngle;
      const rad = ((angle - 90) * Math.PI) / 180;
      const innerRadius = radius - strokeWidth / 2 - 8;
      const outerRadius = radius - strokeWidth / 2 - (i % 2 === 0 ? 18 : 12);

      result.push({
        x1: cx + innerRadius * Math.cos(rad),
        y1: cy + innerRadius * Math.sin(rad),
        x2: cx + outerRadius * Math.cos(rad),
        y2: cy + outerRadius * Math.sin(rad),
        major: i % 2 === 0,
        value: min + (i / tickCount) * (max - min),
      });
    }
    return result;
  }, [cx, cy, radius, strokeWidth, startAngle, sweepAngle, min, max]);

  // Status colors
  const statusColors = {
    normal: { glow: '#FF8C00', text: '#FF8C00' },
    warning: { glow: '#FFBA08', text: '#FFBA08' },
    critical: { glow: '#FF0000', text: '#FF0000' },
    offline: { glow: '#4A4A4A', text: '#4A4A4A' },
  };
  const colors = statusColors[status] || statusColors.normal;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gauge-grad-${sensorId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF8C00" />
            <stop offset="50%" stopColor="#FF4500" />
            <stop offset="100%" stopColor="#DC2F02" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`glow-${sensorId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="#2D2D2D"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Active arc */}
        <motion.path
          d={describeArc(startAngle, currentAngle)}
          fill="none"
          stroke={`url(#gauge-grad-${sensorId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={`url(#glow-${sensorId})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Tick marks */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tick.major ? '#4A4A4A' : '#2D2D2D'}
            strokeWidth={tick.major ? 2 : 1}
          />
        ))}

        {/* Center decoration */}
        <circle
          cx={cx}
          cy={cy}
          r={radius * 0.15}
          fill="#1A1A1A"
          stroke="#FF4500"
          strokeWidth={2}
        />

        {/* Needle */}
        <motion.g
          initial={{ rotate: startAngle - 90 }}
          animate={{ rotate: currentAngle - 90 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - radius + strokeWidth}
            stroke={colors.glow}
            strokeWidth={3}
            strokeLinecap="round"
            filter={`url(#glow-${sensorId})`}
          />
          {/* Needle tip */}
          <circle
            cx={cx}
            cy={cy - radius + strokeWidth + 5}
            r={4}
            fill={colors.glow}
          />
        </motion.g>

        {/* Center cap */}
        <circle
          cx={cx}
          cy={cy}
          r={radius * 0.08}
          fill="#FF4500"
        />
      </svg>

      {/* Center value display */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ paddingTop: size * 0.15 }}
      >
        <motion.span
          className="font-rajdhani font-bold text-off-white"
          style={{ fontSize: size * 0.18, color: colors.text }}
          key={value}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {value.toFixed(1)}
        </motion.span>
        <span
          className="text-dim-grey font-inter"
          style={{ fontSize: size * 0.07 }}
        >
          {unit}
        </span>
      </div>

      {/* Title */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ bottom: size * 0.08 }}
      >
        <span
          className="font-rajdhani font-medium text-off-white uppercase tracking-wider"
          style={{ fontSize: size * 0.065 }}
        >
          {title || label}
        </span>
      </div>

      {/* Status indicator */}
      {status === 'critical' && (
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 rounded-full bg-strobe-red"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        />
      )}
    </div>
  );
}

/**
 * SystemHealthGauge - Specialized gauge for overall system health
 */
export function SystemHealthGauge({ size = 180, className = '' }) {
  const panelHealth = useSensorStore((state) => state.panelHealth);
  const systemStatus = useSensorStore((state) => state.systemStatus);

  const percentage = panelHealth / 100;
  const startAngle = 135;
  const endAngle = 405;
  const sweepAngle = endAngle - startAngle;
  const currentAngle = startAngle + percentage * sweepAngle;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.05;

  const polarToCartesian = (angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (startAng, endAng) => {
    const start = polarToCartesian(endAng);
    const end = polarToCartesian(startAng);
    const largeArcFlag = endAng - startAng <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const statusColors = {
    normal: '#10B981',
    warning: '#FFBA08',
    critical: '#FF0000',
    offline: '#4A4A4A',
  };

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="health-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="#2D2D2D"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Fill */}
        <motion.path
          d={describeArc(startAngle, currentAngle)}
          fill="none"
          stroke={statusColors[systemStatus]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter="url(#health-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
      </svg>

      {/* Value */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-rajdhani font-bold"
          style={{ fontSize: size * 0.2, color: statusColors[systemStatus] }}
        >
          {panelHealth.toFixed(0)}%
        </span>
        <span className="text-dim-grey text-xs uppercase tracking-wider">
          System Health
        </span>
      </div>
    </div>
  );
}

export default TachometerGauge;
