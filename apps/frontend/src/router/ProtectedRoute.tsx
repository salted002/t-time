import type { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RESERVED_SLUGS } from '@/lib/slugValidation';
import ErrorPage from '@/pages/errorPage';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();

  // /admin/students처럼 예약어(admin, login 등)가 슬러그 자리에 걸린 주소는 학원 슬러그가 아니므로
  // 로그인 여부와 상관없이 404. 이동 경로(홈으로)는 errorPage가 영역(/admin 등)에 맞게 정한다.
  if (slug && (RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return <ErrorPage status={404} message="요청하신 페이지를 찾을 수 없습니다." />;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  // 내 학원이 아닌 슬러그는 같은 하위 경로의 내 학원 주소로 보낸다 (API 명세서 "URL 구조")
  // 존재 여부와 상관없이 똑같이 이동하므로 다른 학원의 존재 여부는 드러나지 않는다
  if (slug && slug !== user.academySlug) {
    const rest = location.pathname.split('/').slice(2).join('/');
    return <Navigate to={`/${user.academySlug}/${rest}${location.search}`} replace />;
  }
  return <>{children}</>;
}
