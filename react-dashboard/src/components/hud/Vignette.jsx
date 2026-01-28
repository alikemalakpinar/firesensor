import { motion, AnimatePresence } from 'framer-motion';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * Vignette - Full-screen overlay effect for system status
 *
 * Features:
 * - Pulsing red vignette for critical status
 * - Subtle amber glow for warning status
 * - Smooth transitions between states
 */
export function Vignette() {
  const systemStatus = useSensorStore((state) => state.systemStatus);

  return (
    <AnimatePresence>
      {/* Critical status - pulsing red vignette */}
      {systemStatus === 'critical' && (
        <motion.div
          key="critical-vignette"
          className="fixed inset-0 pointer-events-none z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Main vignette */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(
                  ellipse at center,
                  transparent 0%,
                  transparent 40%,
                  rgba(255, 42, 109, 0.1) 70%,
                  rgba(255, 42, 109, 0.3) 100%
                )
              `,
            }}
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'easeInOut',
            }}
          />

          {/* Edge glow lines */}
          <motion.div
            className="absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 100px 20px rgba(255, 42, 109, 0.2)',
            }}
            animate={{
              boxShadow: [
                'inset 0 0 100px 20px rgba(255, 42, 109, 0.2)',
                'inset 0 0 120px 30px rgba(255, 42, 109, 0.3)',
                'inset 0 0 100px 20px rgba(255, 42, 109, 0.2)',
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: 'easeInOut',
            }}
          />

          {/* Corner accents */}
          <CornerAccent position="top-left" color="#FF2A6D" />
          <CornerAccent position="top-right" color="#FF2A6D" />
          <CornerAccent position="bottom-left" color="#FF2A6D" />
          <CornerAccent position="bottom-right" color="#FF2A6D" />

          {/* Scan line effect */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            style={{ mixBlendMode: 'overlay' }}
          >
            <motion.div
              className="absolute w-full h-1 bg-gradient-to-r from-transparent via-neon-red/30 to-transparent"
              animate={{ y: ['-100vh', '100vh'] }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: 'linear',
              }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Warning status - subtle amber glow */}
      {systemStatus === 'warning' && (
        <motion.div
          key="warning-vignette"
          className="fixed inset-0 pointer-events-none z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(
                  ellipse at center,
                  transparent 0%,
                  transparent 50%,
                  rgba(255, 179, 15, 0.05) 80%,
                  rgba(255, 179, 15, 0.1) 100%
                )
              `,
            }}
          />

          {/* Corner accents */}
          <CornerAccent position="top-left" color="#FFB30F" subtle />
          <CornerAccent position="top-right" color="#FFB30F" subtle />
          <CornerAccent position="bottom-left" color="#FFB30F" subtle />
          <CornerAccent position="bottom-right" color="#FFB30F" subtle />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * CornerAccent - Decorative corner bracket
 */
function CornerAccent({ position, color, subtle = false }) {
  const positions = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 rotate-90',
    'bottom-left': 'bottom-0 left-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-180',
  };

  return (
    <motion.div
      className={`absolute ${positions[position]} w-24 h-24`}
      animate={
        subtle
          ? {}
          : {
              opacity: [0.5, 1, 0.5],
            }
      }
      transition={{
        repeat: Infinity,
        duration: 1,
        ease: 'easeInOut',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ opacity: subtle ? 0.3 : 0.6 }}
      >
        <path
          d="M 0 30 L 0 0 L 30 0"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <path
          d="M 0 20 L 0 5 L 5 0 L 20 0"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    </motion.div>
  );
}

/**
 * AlertBanner - Top notification banner for critical alerts
 */
export function AlertBanner() {
  const systemStatus = useSensorStore((state) => state.systemStatus);
  const criticalSensors = useSensorStore((state) =>
    Object.values(state.sensors).filter((s) => s.status === 'critical')
  );

  return (
    <AnimatePresence>
      {systemStatus === 'critical' && criticalSensors.length > 0 && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[90] flex justify-center pointer-events-none"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <motion.div
            className={`
              mt-4 px-6 py-3
              bg-neon-red/20 backdrop-blur-xl
              border border-neon-red/50
              rounded-full
              flex items-center gap-3
              shadow-lg shadow-neon-red/30
              pointer-events-auto
            `}
            animate={{
              boxShadow: [
                '0 10px 40px -10px rgba(255, 42, 109, 0.3)',
                '0 10px 50px -10px rgba(255, 42, 109, 0.5)',
                '0 10px 40px -10px rgba(255, 42, 109, 0.3)',
              ],
            }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {/* Pulsing dot */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-red opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-red"></span>
            </span>

            {/* Alert text */}
            <span className="text-neon-red font-rajdhani font-semibold uppercase tracking-wider">
              {criticalSensors.length} Critical Alert
              {criticalSensors.length > 1 ? 's' : ''}
            </span>

            {/* Sensor names */}
            <span className="text-white/60 text-sm">
              {criticalSensors
                .map((s) => s.label)
                .slice(0, 3)
                .join(', ')}
              {criticalSensors.length > 3 && ` +${criticalSensors.length - 3}`}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Vignette;
