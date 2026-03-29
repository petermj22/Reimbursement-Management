import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserRole } from '@/types';

const demoAccounts: { role: UserRole; email: string; name: string; description: string }[] = [
  { role: 'admin', email: 'admin@acme.com', name: 'Sarah Chen', description: 'Full system access, user management, analytics' },
  { role: 'manager', email: 'manager@acme.com', name: 'James Rodriguez', description: 'Approve/reject expenses, team overview' },
  { role: 'employee', email: 'john@acme.com', name: 'John Smith', description: 'Submit expenses, track reimbursements' },
];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password || 'demo')) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Try a demo account below.');
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    if (login(demoEmail, 'demo')) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden" style={{ background: 'var(--gradient-sidebar)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8" style={{ background: 'var(--gradient-primary)' }}>
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-sidebar-accent-foreground mb-4">ReimburseFlow</h1>
          <p className="text-lg text-sidebar-muted mb-8">Enterprise-grade expense management with intelligent approval workflows.</p>
          <div className="space-y-4">
            {['Multi-level approval engine', 'Real-time notifications', 'OCR receipt scanning', 'Advanced analytics'].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-sm text-sidebar-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">ReimburseFlow</h1>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="space-y-4 mb-8">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" style={{ background: 'var(--gradient-primary)' }}>
              Sign In <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">Quick demo access</span></div>
          </div>

          <div className="space-y-3">
            {demoAccounts.map((acc, i) => (
              <motion.button
                key={acc.role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                onClick={() => handleDemoLogin(acc.email)}
                className="w-full flex items-center gap-4 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary text-secondary-foreground text-xs font-bold">
                  {acc.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{acc.name} <span className="text-xs text-muted-foreground capitalize">({acc.role})</span></p>
                  <p className="text-xs text-muted-foreground truncate">{acc.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
