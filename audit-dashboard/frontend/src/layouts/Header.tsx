import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-base-900/60 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="signal-dot" />
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          Live monitoring active
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right">
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
