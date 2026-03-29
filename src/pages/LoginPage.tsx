import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Eye, EyeOff, Loader2, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

const demoAccounts: { role: UserRole; email: string; password: string; name: string; description: string }[] = [
  { role: 'admin', email: 'admin@acme.com', password: 'demo123', name: 'Sarah Chen', description: 'Full system access, user management, analytics' },
  { role: 'manager', email: 'manager@acme.com', password: 'demo123', name: 'James Rodriguez', description: 'Approve/reject expenses, team overview' },
  { role: 'employee', email: 'john@acme.com', password: 'demo123', name: 'John Smith', description: 'Submit expenses, track reimbursements' },
];

const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuth();
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        // Mock sign up success for demo
        toast.success('Account created!', { description: `Welcome aboard, ${name || email.split('@')[0]}!` });
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const success = await login(email, password || 'demo123');
        if (success) {
          toast.success('Signed in successfully');
          navigate('/dashboard');
        } else {
          setError('Invalid credentials. Try a demo account below.');
        }
      }
    } catch {
      setError('Connection error. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setLoading(true);
    toast.info('Authenticating with Google...');
    try {
      const success = await loginWithGoogle(tokenResponse.access_token || tokenResponse.credential);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Google login failed. Please try again.');
      }
    } catch {
      setError('Connection error with Google Login.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleFlow = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => {
      toast.error("Google Login Failed");
      setError('Google login failed or was cancelled.');
    }
  });

  const handleMicrosoftSuccess = async () => {
    setLoading(true);
    toast.info('Authenticating with Microsoft...');
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ["user.read"]
      });
      const success = await loginWithMicrosoft(loginResponse.accessToken);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Microsoft login failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Microsoft authentication failed or was cancelled.');
      toast.error('Microsoft login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = (provider: string) => {
    if (provider === 'Google') {
      loginWithGoogleFlow();
      return;
    }
    if (provider === 'Microsoft') {
      handleMicrosoftSuccess();
      return;
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setLoading(true);
    setError('');
    toast.info('Authenticating Demo Account...');
    try {
      const success = await login(demoEmail, demoPassword);
      if (success) {
        toast.success(`Welcome back!`);
        navigate('/dashboard');
      } else {
        setError('Login failed. Please check your backend server.');
      }
    } catch {
      setError('Connection error. Make sure the backend server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0add]">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden bg-[#050505] border-r border-white/5">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px]" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-lg"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-10 bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-6">ReimburseFlow</h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed font-light">
            Enterprise-grade expense management with intelligent approval workflows and automated OCR receipt sensing.
          </p>
          <div className="space-y-6">
            {[
              { text: 'Multi-level approval engine & smart routing', icon: Shield },
              { text: 'Real-time WebSocket notifications & syncing', icon: Sparkles },
              { text: 'High-accuracy OCR receipt scanning', icon: Eye },
            ].map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                className="flex items-center gap-4 text-zinc-300"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <feature.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-base text-zinc-200">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">ReimburseFlow</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-white tracking-tight mb-2">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-zinc-400">
              {isSignUp ? 'Enter your details below to get started' : 'Sign in to your account to continue'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5 mb-8">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-black/40 border-white/10 text-white focus-visible:ring-indigo-500 placeholder:text-zinc-600"
                    disabled={loading}
                    required={isSignUp}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className="bg-black/40 border-white/10 text-white focus-visible:ring-indigo-500 placeholder:text-zinc-600"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                {!isSignUp && (
                  <a href="#" onClick={(e) => { e.preventDefault(); toast.info('Password reset email sent (mock).'); }} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors font-medium">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-black/40 border-white/10 text-white focus-visible:ring-indigo-500 placeholder:text-zinc-600 pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-rose-400 font-medium">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] h-11 transition-all" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (isSignUp ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />)}
              {isSignUp ? 'Create account' : 'Sign In'}
            </Button>
          </form>

          {/* SSO Section */}
          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0a0a0a] px-3 text-zinc-500 uppercase tracking-wider font-semibold">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <Button type="button" onClick={() => handleSSOLogin('Google')} className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-white/10 text-zinc-200 h-11 transition-all">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
              <Button type="button" onClick={() => handleSSOLogin('Microsoft')} className="w-full bg-[#111] hover:bg-[#1a1a1a] border border-white/10 text-zinc-200 h-11 transition-all">
                <svg className="w-4 h-4 mr-3" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
                Microsoft
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-zinc-400 mb-8">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-white hover:text-indigo-300 font-semibold transition-colors underline underline-offset-4">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {!isSignUp && (
            <>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center"><span className="bg-[#0a0a0a] px-3 text-xs text-zinc-600 font-medium">Test Environment Access</span></div>
              </div>

              <div className="space-y-3">
                {demoAccounts.map((acc, i) => (
                  <motion.button
                    key={acc.role}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => handleDemoLogin(acc.email, acc.password)}
                    disabled={loading}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/20 transition-all text-left group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#151515] border border-white/10 text-zinc-300 text-xs font-bold font-mono">
                      {acc.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200">{acc.name} <span className="text-xs text-indigo-400 capitalize font-medium ml-1">({acc.role})</span></p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{acc.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </motion.button>
                ))}
              </div>
            </>
          )}

        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
