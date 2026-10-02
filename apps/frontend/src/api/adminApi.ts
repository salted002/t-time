import axios from 'axios';

const ADMIN_TOKEN_KEY = 'ttime_admin_token';

// 학원 계정 토큰(ttime_token)과 섞이지 않도록 운영자 토큰은 별도 키·별도 axios 인스턴스를 쓴다.
export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export const adminHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

adminHttp.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminHttp.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAdminToken();
    }
    return Promise.reject(error);
  },
);

export interface AdminAcademy {
  id: string;
  name: string;
  phone: string | null;
  ownerName: string | null;
  studentCount: number;
  loginEmail: string | null;
}

interface AdminLoginResponse {
  token: string;
  admin: { id: string; email: string };
}

interface AdminAcademyListResponse {
  academies: AdminAcademy[];
  count: number;
}

export const adminApi = {
  // POST /admin/auth/login
  login: (email: string, password: string): Promise<AdminLoginResponse> =>
    adminHttp
      .post<AdminLoginResponse>('/admin/auth/login', { email, password })
      .then((response) => response.data),

  // GET /admin/academies
  listAcademies: (params: { page: number; size: number }): Promise<AdminAcademyListResponse> =>
    adminHttp
      .get<AdminAcademyListResponse>('/admin/academies', { params })
      .then((response) => response.data),
};
