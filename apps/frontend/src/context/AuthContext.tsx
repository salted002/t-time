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
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (getToken() ? readUser() : null));

  const value: AuthContextValue = {
    user,
    login: async (email, password, rememberMe) => {
      const response = await api.post<LoginResponse>('/auth/login', { email, password });

      setToken(response.data.token, rememberMe);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(USER_KEY, JSON.stringify(response.data.user));
      setUser(response.data.user);
    },
    logout: () => {
      clearToken();
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
