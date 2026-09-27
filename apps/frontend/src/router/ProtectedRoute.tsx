import type { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (slug && slug !== user.academySlug) {
    return <Navigate to={`/${user.academySlug}/`} replace />;
  }
  return <>{children}</>;
}
