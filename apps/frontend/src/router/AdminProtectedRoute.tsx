import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAdminToken } from '@/api/adminApi';

// 운영자 토큰이 없으면 운영자 로그인 화면으로 보낸다.
export default function AdminProtectedRoute({ children }: { children: ReactNode }) {
  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
