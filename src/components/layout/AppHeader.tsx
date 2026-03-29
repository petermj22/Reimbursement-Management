import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Receipt, CheckSquare, Users, BarChart3,
  Settings, Bell, LogOut, Shield, Menu, X, WifiOff, Download
} from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

const navItems = {
  admin: [
    { to: '/dashboard', label: 'Overview' },
    { to: '/expenses', label: 'Expenses' },
    { to: '/approvals', label: 'Approvals' },
    { to: '/users', label: 'Users' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/security', label: 'Security' },
    { to: '/settings', label: 'Settings' },
  ],
  manager: [
    { to: '/dashboard', label: 'Overview' },
    { to: '/expenses', label: 'Expenses' },
    { to: '/approvals', label: 'Approvals' },
    { to: '/analytics', label: 'Analytics' },
  ],
  employee: [
    { to: '/dashboard', label: 'Overview' },
    { to: '/expenses', label: 'Expenses' },
  ],
};

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOnline, isInstallable, install } = usePWA();
  const unreadCount = mockNotifications.filter(n => !n.isRead && n.userId === user?.id).length;
  const items = navItems[user?.role || 'employee'];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0a0a0a]/60">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white">FlowPro</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => 
                    `relative px-3 py-1.5 text-sm font-medium transition-colors duration-300 rounded-full ${
                      isActive ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute inset-0 rounded-full bg-white/10"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate('/notifications')} className="relative p-2 text-zinc-400 hover:text-white transition-colors">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </button>
              <div className="h-4 w-[1px] bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold text-white">{user?.firstName} {user?.lastName}</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500">{user?.role}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-600 border border-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {user?.firstName[0]}{user?.lastName[0]}
                </div>
                <button onClick={handleLogout} className="text-zinc-500 hover:text-white p-1 transition-colors ml-2">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-16 inset-x-0 z-40 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/90 backdrop-blur text-black text-xs font-semibold"
          >
            <WifiOff className="w-3.5 h-3.5" />
            You are offline — changes will sync when your connection is restored
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#111] border border-white/10 rounded-2xl px-5 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Install ReimburseFlow</p>
              <p className="text-[10px] text-zinc-500">Work offline · Native app feel</p>
            </div>
            <Button onClick={install} size="sm" className="ml-2 h-7 text-xs bg-indigo-600 hover:bg-indigo-500 border-0 gap-1.5">
              <Download className="w-3 h-3" /> Install
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-x-0 top-16 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 p-4"
          >
            <nav className="flex flex-col space-y-2">
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-zinc-400'}`}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                    {user?.firstName[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{user?.firstName}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{user?.role}</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-white p-2">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
