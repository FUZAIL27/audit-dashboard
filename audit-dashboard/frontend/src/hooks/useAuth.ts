import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { LoginRequest } from '@/types/auth.types';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      navigate('/dashboard');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    try {
      await authService.logout();
    } finally {
      logout();
      // Clear all cached server-state (logs, dashboard stats, etc.) so the
      // next person to use this browser never sees a stale, previously
      // authenticated user's data flash on screen before it refetches.
      queryClient.clear();
      navigate('/login');
    }
  };
}
