import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Cpu,
  BarChart3,
  Bell,
  Settings,
  Flame,
} from 'lucide-react';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * BottomNavigation - Modern bottom navigation bar
 *
 * "Magma & Obsidian" aesthetic:
 * - Smoked glass with ember accent
 * - Floating design with rounded corners
 * - Animated active indicator
 */
export function BottomNavigation() {
  const activePage = useSensorStore((state) => state.activePage);
  const setActivePage = useSensorStore((state) => state.setActivePage);
  const systemStatus = useSensorStore((state) => state.systemStatus);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'sensors', icon: Cpu, label: 'Sensors' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <motion.nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
    >
      <div
        className={`
          flex items-center gap-1 px-2 py-2
          bg-black/70 backdrop-blur-xl
          border border-burnt-orange/20
          rounded-2xl
          shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_15px_rgba(255,69,0,0.1)]
        `}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 rounded-2xl opacity-[0.02] pointer-events-none overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo/Home */}
        <motion.button
          className={`
            relative p-3 rounded-xl
            bg-burnt-orange/20 text-burnt-orange
            border border-burnt-orange/30
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActivePage('dashboard')}
        >
          <Flame size={20} />
          {systemStatus === 'critical' && (
            <motion.span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-strobe-red"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
          )}
        </motion.button>

        {/* Divider */}
        <div className="w-px h-8 bg-burnt-orange/20 mx-1" />

        {/* Nav items */}
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.id}
            hasAlert={item.id === 'alerts' && systemStatus === 'critical'}
            onClick={() => setActivePage(item.id)}
          />
        ))}

        {/* Top glow line */}
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-burnt-orange/40 to-transparent" />
      </div>
    </motion.nav>
  );
}

/**
 * NavItem - Individual navigation button
 */
function NavItem({ icon: Icon, label, isActive, hasAlert, onClick }) {
  return (
    <motion.button
      className={`
        relative flex flex-col items-center justify-center
        px-4 py-2 rounded-xl min-w-[60px]
        transition-all duration-200
        ${
          isActive
            ? 'bg-burnt-orange/15 text-deep-amber'
            : 'text-warm-grey hover:text-off-white hover:bg-white/5'
        }
      `}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon size={20} />
      <span className="text-[10px] mt-1 font-medium uppercase tracking-wider">
        {label}
      </span>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-burnt-orange"
          layoutId="nav-indicator"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}

      {/* Alert badge */}
      {hasAlert && (
        <motion.span
          className="absolute top-1 right-2 w-2 h-2 rounded-full bg-strobe-red"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}
    </motion.button>
  );
}

/**
 * MiniStatusBar - Compact status indicators for bottom nav
 */
export function MiniStatusBar() {
  const connectionStatus = useSensorStore((state) => state.connectionStatus);
  const panelHealth = useSensorStore((state) => state.panelHealth);

  const isConnected = connectionStatus === 'connected';

  return (
    <motion.div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-3 text-xs font-mono text-warm-grey">
        {/* Connection */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-400' : 'bg-strobe-red animate-pulse'
            }`}
          />
          <span className={isConnected ? 'text-emerald-400' : 'text-strobe-red'}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <span className="text-warm-grey/30">|</span>

        {/* Health */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              panelHealth > 90
                ? 'bg-emerald-400'
                : panelHealth > 70
                  ? 'bg-warning-yellow'
                  : 'bg-strobe-red'
            }`}
          />
          <span>HEALTH {panelHealth.toFixed(0)}%</span>
        </div>
      </div>
    </motion.div>
  );
}

export default BottomNavigation;
