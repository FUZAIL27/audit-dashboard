import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ListTree, UploadCloud, ShieldCheck, ChevronsLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/store/ui.store';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/logs', label: 'Audit Logs', icon: ListTree },
  { to: '/upload', label: 'Upload', icon: UploadCloud },
];

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
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
            onClick={onNavigate}
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
    </>
  );
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const closeMobileSidebar = useUIStore((s) => s.closeMobileSidebar);

  return (
    <>
      {/* Desktop / tablet sidebar — unchanged behavior, hidden on mobile */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 232 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="relative hidden h-screen flex-col border-r border-border bg-base-900/80 backdrop-blur-xl md:flex"
      >
        <SidebarContent collapsed={collapsed} />
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

      {/* Mobile drawer sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-base-950/70 backdrop-blur-sm md:hidden"
              onClick={closeMobileSidebar}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-[232px] max-w-[80vw] flex-col border-r border-border bg-base-900/95 backdrop-blur-xl md:hidden"
            >
              <SidebarContent collapsed={false} onNavigate={closeMobileSidebar} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
