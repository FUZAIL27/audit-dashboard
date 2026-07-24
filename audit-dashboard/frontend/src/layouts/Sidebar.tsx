import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ListTree, UploadCloud, ShieldCheck, ChevronsLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/store/ui.store';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/logs', label: 'Audit Logs', icon: ListTree },
  { to: '/upload', label: 'Upload', icon: UploadCloud },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 232 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex h-screen flex-col border-r border-border bg-base-900/80 backdrop-blur-xl"
    >
      <div className="flex h-16 items-center gap-2 px-5">
        <ShieldCheck size={22} className="text-signal shrink-0" />
        {!collapsed && (
          <span className="font-display text-lg font-semibold tracking-tight text-text-primary">
            Sentinel
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-signal/10 text-signal border border-signal/20'
                  : 'text-text-secondary hover:bg-base-800 hover:text-text-primary border border-transparent'
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        className="mx-3 mb-4 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-text-muted hover:text-text-primary hover:bg-base-800"
      >
        <ChevronsLeft
          size={16}
          className={cn('transition-transform', collapsed && 'rotate-180')}
        />
      </button>
    </motion.aside>
  );
}
