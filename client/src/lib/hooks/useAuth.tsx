'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import { authApi } from '@/lib/api/auth.api';
import { apiClient } from '@/lib/api/apiClient';
import { NotificationToastPoller } from '@/components/NotificationToastPoller';
import type { IUser } from '@/lib/types';
import 'react-toastify/dist/ReactToastify.css';

interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (loginValue: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    login: string;
    phone: string;
    email: string;
    password: string;
    positionId?: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkRole: (roles: string[]) => boolean;
  setUser: (user: IUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        try {
          await apiClient.post('/auth/refresh');
          const userData = await authApi.me();
          setUser(userData);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (loginValue: string, password: string) => {
    await authApi.login(loginValue, password);
    const userData = await authApi.me();
    setUser(userData);
    router.push('/main');
  };

  const register = async (data: {
    fullName: string;
    login: string;
    phone: string;
    email: string;
    password: string;
    positionId?: number;
  }) => {
    await authApi.register(data);
    const userData = await authApi.me();
    setUser(userData);
    router.push('/main');
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    setUser(null);
    router.push('/auth/login');
  };

  const checkRole = (roles: string[]) => {
    if (!user?.roleName) return false;
    return roles.includes(user.roleName);
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      login, register, logout,
      checkRole, setUser,
    }}>
      {children}
      <NotificationToastPoller />
      <ToastContainer
        position="top-right"
        autoClose={8000}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
        limit={4}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
