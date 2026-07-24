import { useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

/**
 * The access token is intentionally kept in memory only (not localStorage)
 * to reduce XSS blast radius. That means a full page reload loses both the
 * token and the `user` object even though the httpOnly refresh cookie is
 * still valid — so on mount we trade the refresh cookie for a fresh access
 * token, then use it to re-fetch the user's own profile via `/auth/me`.
 */
export function useSessionBootstrap() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { accessToken } = await authService.refresh();
        if (cancelled) return;

        // Prime the store with the token first so the axios interceptor
        // attaches it to the /me request that follows.
        useAuthStore.getState().setAccessToken(accessToken);
        const user = await authService.me();
        if (cancelled) return;

        setSession(accessToken, user);
      } catch {
        // No valid session — expected on first visit or after the refresh
        // token expires. The person will see the login page.
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isBootstrapping;
}
