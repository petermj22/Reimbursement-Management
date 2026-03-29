import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CoreWebVitalsFooter } from '@/components/CoreWebVitalsFooter';
import { AmbientBackground } from '@/components/AmbientBackground';

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative">
      {/* Subtle animated particle mesh — renders behind all content */}
      <AmbientBackground />

      {/* Content stack above the canvas */}
      <div className="relative z-10 flex flex-col flex-1">
        <AppHeader />

        <main className="w-full flex-1 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, scale: 0.98, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, scale: 0.98, filter: "blur(4px)" }}
              transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 1 }}
              className="w-full h-full relative"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <CoreWebVitalsFooter />
      </div>
    </div>
  );
};
