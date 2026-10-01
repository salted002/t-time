import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export interface AuthMe {
  user: { id: string; name: string; email: string };
  academy: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    phone: string | null;
    address: string | null;
    smsSenderNumber: string | null;
    subscriptionStatus: 'FREE' | 'SUBSCRIBED';
  };
  isDemo: boolean;
}

export function useAuthMe() {
  const [me, setMe] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    api
      .get<AuthMe>('/auth/me')
      .then((response) => {
        if (!ignore) {
          const { user, academy, isDemo } = response.data;
          setMe({ user, academy, isDemo });
        }
      })
      // 실패하면 me는 null로 두고, 화면은 로그인 시 저장한 사용자 정보로 대신 표시
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { me, loading };
}
