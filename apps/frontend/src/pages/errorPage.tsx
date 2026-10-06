import { AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { getAdminToken } from '@/api/adminApi';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export interface ErrorPageState {
  /** HTTP 상태 코드 (예: 404) */
  status?: number;
  /** 응답 `{ success: false, message }`의 message */
  message?: string;
}

interface ErrorPageProps extends ErrorPageState {
  /** "홈으로" 버튼의 이동 경로 */
  homePath?: string;
}

const ADMIN_HOME_PATH = '/admin/academies';
const ADMIN_LOGIN_PATH = '/admin/login';

const DEFAULT_MESSAGE = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.';

// 상태 코드별 제목
const STATUS_TITLES: Record<number, string> = {
  400: '잘못된 요청입니다',
  401: '인증이 필요합니다',
  403: '접근 권한이 없습니다',
  404: '페이지를 찾을 수 없습니다',
  409: '이미 사용 중인 값입니다',
  410: '만료된 링크입니다',
  422: '처리할 수 없는 요청입니다',
  500: '서버 오류가 발생했습니다',
  502: '외부 서비스 연결에 실패했습니다',
};

// 응답이 success: false일 때 message를 보여주는 에러 페이지.
// 라우트로 이동할 때는 navigate('/error', { state: { status, message } })로 전달하고,
// 다른 화면 안에서는 <ErrorPage status={...} message={...} />로 직접 렌더링한다.
export default function ErrorPage({ status, message, homePath }: ErrorPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // 운영자 영역(/admin/...)에서는 운영자 로그인 상태면 학원 목록으로, 아니면 운영자 로그인으로,
  // 그 외 영역에서는 로그인한 학원 사용자는 자기 학원(/{slug})으로, 아니면 랜딩 페이지로 보낸다
  const isAdminArea = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  let defaultHomePath = user ? `/${user.academySlug}` : '/';
  if (isAdminArea) {
    defaultHomePath = getAdminToken() ? ADMIN_HOME_PATH : ADMIN_LOGIN_PATH;
  }
  const resolvedHomePath = homePath ?? defaultHomePath;
  const state = (location.state ?? {}) as ErrorPageState;

  const resolvedStatus = status ?? state.status;
  const resolvedMessage = message ?? state.message ?? DEFAULT_MESSAGE;
  const title = (resolvedStatus && STATUS_TITLES[resolvedStatus]) || '문제가 발생했습니다';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertTriangle className="text-destructive" />
            </EmptyMedia>
            {resolvedStatus && (
              <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                {resolvedStatus}
              </p>
            )}
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription role="alert">{resolvedMessage}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                이전 페이지
              </Button>
              <Button type="button" onClick={() => navigate(resolvedHomePath, { replace: true })}>
                홈으로
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      </div>
    </div>
  );
}
