import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Cpu,
  BarChart3,
  Bell,
  Settings,
  Flame,
  Plus,
  Layers,
  Users,
} from 'lucide-react';
import { useSensorStore } from '../../stores/useSensorStore';

/**
 * Sidebar - Left vertical navigation (like the reference design)
 */
export function BottomNavigation() {
  const activePage = useSensorStore((state) => state.activePage);
  const setActivePage = useSensorStore((state) => state.setActivePage);
  const systemStatus = useSensorStore((state) => state.systemStatus);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard },
    { id: 'sensors', icon: Cpu },
    { id: 'analytics', icon: BarChart3 },
    { id: 'alerts', icon: Bell },
    { id: 'settings', icon: Settings },
  ];

  return (
    <motion.nav
      className="fixed left-0 top-0 bottom-0 w-[72px] z-50 flex flex-col items-center bg-sidebar-bg border-r border-border py-5"
      initial={{ x: -72, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Logo */}
      <button
        className="w-11 h-11 rounded-2xl bg-text-primary flex items-center justify-center mb-8 relative"
        onClick={() => setActivePage('dashboard')}
      >
        <Flame className="text-white" size={20} />
        {systemStatus === 'critical' && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-danger border-2 border-sidebar-bg" />
        )}
      </button>

      {/* Nav Items */}
      <div className="flex flex-col items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`
                w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200
                ${isActive
                  ? 'bg-text-primary text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-dark'
                }
              `}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-2">
        <button className="w-11 h-11 rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-dark transition-all duration-200">
          <Plus size={20} />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary-lighter flex items-center justify-center">
          <span className="text-primary text-sm font-semibold">FL</span>
        </div>
      </div>
    </motion.nav>
  );
}

/**
 * MiniStatusBar - Connection status (now positioned in header area)
 */
export function MiniStatusBar() {
  const connectionStatus = useSensorStore((state) => state.connectionStatus);
  const panelHealth = useSensorStore((state) => state.panelHealth);
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-success' : 'bg-danger animate-pulse'
          }`}
        />
        <span className={`text-xs font-medium ${isConnected ? 'text-success' : 'text-danger'}`}>
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>
      <span className="text-border">|</span>
      <span className="text-xs text-text-tertiary">
        Health {panelHealth.toFixed(0)}%
      </span>
    </div>
  );
}

export default BottomNavigation;
