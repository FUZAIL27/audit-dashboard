import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui.store';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);

  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-base-900/60 px-3 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-base-800 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
        <span className="signal-dot shrink-0" />
        <span className="hidden truncate text-xs font-medium uppercase tracking-wider text-text-secondary sm:inline">
          Live monitoring active
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-text-primary leading-none">{user.username}</p>
            <p className="text-xs text-text-muted mt-0.5 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-muted hover:text-severity-critical hover:border-severity-critical/30 transition-colors"
          aria-label="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
