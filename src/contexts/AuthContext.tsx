// =============================================================
// AUTH CONTEXT - Now backed by Redux store + Socket.IO integration
// =============================================================
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout as logoutAction, setUser, setLoading } from '@/store';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { toast } from 'sonner';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithMicrosoft: (credential: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = 'http://localhost:3001/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, token, loading } = useAppSelector(state => state.auth);

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (!savedToken) {
        dispatch(setLoading(false));
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          dispatch(setCredentials({ user: data.user, token: savedToken }));
          connectSocket(); // Connect WebSocket on verified session
        } else {
          localStorage.removeItem('auth_token');
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    };
    verifySession();
  }, [dispatch]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Login failed');
        return false;
      }
      const data = await res.json();
      dispatch(setCredentials({ user: data.user, token: data.token }));
      connectSocket(); // Connect WebSocket on login
      toast.success(`Welcome back, ${data.user.firstName}!`);
      return true;
    } catch {
      toast.error('Connection error');
      return false;
    }
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Google login failed');
        return false;
      }
      const data = await res.json();
      dispatch(setCredentials({ user: data.user, token: data.token }));
      connectSocket(); // Connect WebSocket on login
      toast.success(`Welcome, ${data.user.firstName}!`);
      return true;
    } catch {
      toast.error('Connection error');
      return false;
    }
  };

  const loginWithMicrosoft = async (credential: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/microsoft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Microsoft login failed');
        return false;
      }
      const data = await res.json();
      dispatch(setCredentials({ user: data.user, token: data.token }));
      connectSocket(); // Connect WebSocket on login
      toast.success(`Welcome, ${data.user.firstName}!`);
      return true;
    } catch {
      toast.error('Connection error');
      return false;
    }
  };

  const logout = () => {
    disconnectSocket(); // Disconnect WebSocket on logout
    dispatch(logoutAction());
    toast.info('Logged out');
  };

  const switchRole = async (role: UserRole) => {
    const demoEmails: Record<UserRole, string> = {
      admin: 'admin@acme.com',
      manager: 'manager@acme.com',
      employee: 'john@acme.com',
    };
    disconnectSocket();
    await login(demoEmails[role], 'demo123');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole, loginWithGoogle, loginWithMicrosoft }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
