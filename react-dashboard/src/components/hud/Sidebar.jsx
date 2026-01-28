import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Cpu,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Wifi,
  WifiOff,
  Shield,
  ShieldAlert,
  Menu,
} from 'lucide-react';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * Sidebar - Collapsible navigation panel
 *
 * Features:
 * - Glassmorphism styling
 * - Animated collapse/expand
 * - Connection status indicator
 * - Page navigation
 * - System status summary
 */
export function Sidebar() {
  const sidebarCollapsed = useSensorStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useSensorStore((state) => state.toggleSidebar);
  const activePage = useSensorStore((state) => state.activePage);
  const setActivePage = useSensorStore((state) => state.setActivePage);
  const connectionStatus = useSensorStore((state) => state.connectionStatus);
  const systemStatus = useSensorStore((state) => state.systemStatus);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'sensors', icon: Cpu, label: 'Sensors' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
  ];

  const ConnectionIcon = connectionStatus === 'connected' ? Wifi : WifiOff;
  const SystemIcon = systemStatus === 'critical' ? ShieldAlert : Shield;

  return (
    <motion.aside
      className={`
        fixed left-0 top-0 h-full z-50
        backdrop-blur-2xl
        bg-void-black/60
        border-r border-white/10
        flex flex-col
        shadow-2xl shadow-black/50
      `}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <div className="relative p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <motion.div
            className="w-10 h-10 rounded-xl bg-electric-cyan/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Radio className="text-electric-cyan" size={22} />
          </motion.div>

          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="font-rajdhani font-bold text-white text-lg tracking-wide">
                  AICO
                </h1>
                <p className="text-[10px] text-electric-cyan uppercase tracking-widest">
                  Fire Detection
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status indicators */}
      <div className="relative p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <StatusIndicator
            icon={ConnectionIcon}
            status={connectionStatus === 'connected' ? 'active' : 'inactive'}
            label={sidebarCollapsed ? null : connectionStatus}
          />
          {!sidebarCollapsed && (
            <StatusIndicator
              icon={SystemIcon}
              status={
                systemStatus === 'critical'
                  ? 'critical'
                  : systemStatus === 'warning'
                    ? 'warning'
                    : 'active'
              }
              label={systemStatus}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.id}
            isCollapsed={sidebarCollapsed}
            onClick={() => setActivePage(item.id)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="relative p-2 border-t border-white/10">
        {/* Settings */}
        <NavItem
          icon={Settings}
          label="Settings"
          isCollapsed={sidebarCollapsed}
          onClick={() => {}}
        />

        {/* Collapse toggle */}
        <motion.button
          className={`
            w-full mt-2 p-3 rounded-lg
            flex items-center justify-center gap-2
            text-white/40 hover:text-white/80
            hover:bg-white/5
            transition-colors
          `}
          onClick={toggleSidebar}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <>
              <ChevronLeft size={18} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Glow line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-cyan/50 to-transparent" />
    </motion.aside>
  );
}

/**
 * NavItem - Navigation menu item
 */
function NavItem({ icon: Icon, label, isActive, isCollapsed, onClick }) {
  return (
    <motion.button
      className={`
        w-full p-3 rounded-lg
        flex items-center gap-3
        transition-all duration-200
        ${
          isActive
            ? 'bg-electric-cyan/15 text-electric-cyan border border-electric-cyan/30'
            : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
        }
      `}
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon size={20} />
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            className="font-medium text-sm whitespace-nowrap"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Active indicator dot */}
      {isActive && isCollapsed && (
        <motion.div
          className="absolute right-2 w-1.5 h-1.5 rounded-full bg-electric-cyan"
          layoutId="active-indicator"
        />
      )}
    </motion.button>
  );
}

/**
 * StatusIndicator - Connection/system status badge
 */
function StatusIndicator({ icon: Icon, status, label }) {
  const statusConfig = {
    active: { color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
    inactive: { color: 'text-gray-500', bg: 'bg-gray-500/20' },
    warning: { color: 'text-amber', bg: 'bg-amber/20' },
    critical: { color: 'text-neon-red', bg: 'bg-neon-red/20' },
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-lg
        ${config.bg}
      `}
    >
      <Icon size={14} className={config.color} />
      {label && (
        <span className={`text-xs capitalize ${config.color}`}>{label}</span>
      )}
    </div>
  );
}

/**
 * MobileMenuButton - Hamburger menu for mobile
 */
export function MobileMenuButton() {
  const toggleSidebar = useSensorStore((state) => state.toggleSidebar);

  return (
    <motion.button
      className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-void-black/80 backdrop-blur-xl border border-white/10"
      onClick={toggleSidebar}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Menu className="text-white" size={20} />
    </motion.button>
  );
}

export default Sidebar;
