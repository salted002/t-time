import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiBase';

const TOKEN_KEY = 'ttime_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, persist: boolean): void {
  const storage = persist ? localStorage : sessionStorage;
  const other = persist ? sessionStorage : localStorage;
  storage.setItem(TOKEN_KEY, token);
  other.removeItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401이어도 세션 만료가 아닌 요청 (로그인 실패, 현재 비밀번호 불일치)
const NON_SESSION_401_URLS = ['/auth/login', '/auth/password'];

let unauthorizedHandler: (() => void) | null = null;

// 세션 만료(401) 시 실행할 함수. AuthProvider가 logout을 등록한다.
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !NON_SESSION_401_URLS.includes(error.config?.url ?? '')
    ) {
      clearToken();
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);
