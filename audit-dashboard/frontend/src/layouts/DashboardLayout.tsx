import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AmbientScene } from '@/three/AmbientScene';

export function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="relative flex h-screen overflow-hidden bg-base-950">
      <AmbientScene />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
