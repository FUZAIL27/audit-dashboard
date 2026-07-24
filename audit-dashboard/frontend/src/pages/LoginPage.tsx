import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Lock, User as UserIcon, AlertCircle, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { AmbientScene } from '@/three/AmbientScene';
import { ApiErrorPayload } from '@/types/auth.types';
import { AxiosError } from 'axios';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Maps a login failure to a message a person should actually see. */
function resolveErrorMessage(error: unknown): string | null {
  if (!error) return null;
  const axiosError = error as AxiosError<ApiErrorPayload>;

  // No `response` means the request never completed — the API is
  // unreachable (server down, CORS rejection, network outage), not a
  // credentials problem. Surface that distinction rather than a generic
  // "invalid credentials" message that would send someone on a wild goose
  // chase re-typing a password that was never actually wrong.
  if (!axiosError.response) {
    return 'Server unavailable. Please check your connection and try again.';
  }

  if (axiosError.response.status === 401) {
    return 'Invalid username or password.';
  }

  if (axiosError.response.status === 429) {
    return 'Too many login attempts. Please wait a few minutes and try again.';
  }

  return axiosError.response.data?.error?.message ?? 'Something went wrong. Please try again.';
}

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const login = useLogin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values);
  };

  const errorMessage = resolveErrorMessage(login.error);
  const isNetworkError = Boolean(login.error && !(login.error as AxiosError).response);

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-base-950">
      <AmbientScene />
      <div className="absolute inset-0 bg-grid-fade" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md px-4 sm:px-6"
      >
        <div className="glass-panel p-6 sm:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-signal/10 border border-signal/25">
              <ShieldCheck size={24} className="text-signal" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-text-primary">Sentinel</h1>
            <p className="mt-1 text-sm text-text-muted">
              Administrator sign-in to the security audit console
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Username
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  className="pl-9"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-severity-critical/30 bg-severity-critical/10 px-3 py-2 text-sm text-severity-critical">
                {isNetworkError ? <WifiOff size={14} /> : <AlertCircle size={14} />}
                {errorMessage}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={login.isPending}>
              Sign in
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
