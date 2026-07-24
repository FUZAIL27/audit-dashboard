import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LogsPage } from '@/pages/LogsPage';
import { UploadPage } from '@/pages/UploadPage';

import { NotFoundPage } from '@/pages/NotFoundPage';
import { ShieldCheck } from 'lucide-react';

function SplashScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-base-950">
      <ShieldCheck size={32} className="text-signal animate-pulseSignal" />
      <p className="text-sm text-text-muted">Establishing secure session…</p>
    </div>
  );
}

export default function App() {
  const isBootstrapping = useSessionBootstrap();

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
