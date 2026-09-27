import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '@/lib/api';
import type { User } from '@/types/auth';

const USER_KEY = 'ttime_user';

interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message: string;
}

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<User>;
  setSession: (user: User, token: string, rememberMe: boolean) => void;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (getToken() ? readUser() : null));

  const persistSession = (nextUser: User, token: string, rememberMe: boolean) => {
    setToken(token, rememberMe);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const value: AuthContextValue = {
    user,
    login: async (email, password, rememberMe) => {
      const response = await api.post<LoginResponse>('/auth/login', { email, password });

      persistSession(response.data.user, response.data.token, rememberMe);
      return response.data.user;
    },
    setSession: persistSession,
    logout: () => {
      clearToken();
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
