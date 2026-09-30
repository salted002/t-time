import { KeyRound, LogOut, MessageCircle, Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuthMe } from '@/hooks/useAuthMe';
import { SUPPORT_EMAIL } from '@/lib/constants';

const SUBSCRIPTION_BADGE = {
  FREE: { label: '무료 플랜', variant: 'secondary' },
  SUBSCRIBED: { label: '구독 중', variant: 'success' },
} as const;

interface AcademyProfileDropdownProps {
  me: AuthMe | null;
  loading: boolean;
  /** /auth/me 조회 전·실패 시 사용할 로그인 시점 사용자 정보 */
  fallbackName: string;
  fallbackEmail: string;
  onLogout: () => void;
}

export function AcademyProfileDropdown({
  me,
  loading,
  fallbackName,
  fallbackEmail,
  onLogout,
}: AcademyProfileDropdownProps) {
  const navigate = useNavigate();
  const { slug } = useParams();

  const name = me?.user.name ?? fallbackName;
  const email = me?.user.email ?? fallbackEmail;
  const academy = me?.academy;
  const subscription = academy ? SUBSCRIPTION_BADGE[academy.subscriptionStatus] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="프로필 메뉴"
        className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Avatar>
          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
            {name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        {(loading || academy) && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-3 py-2">
                {loading || !academy ? (
                  <>
                    <Skeleton className="size-8 rounded-md" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </>
                ) : (
                  <>
                    <Avatar className="rounded-md">
                      <AvatarImage src={academy.logoUrl ?? undefined} alt="" />
                      <AvatarFallback className="rounded-md">{academy.name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {academy.name}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">/{academy.slug}</span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {subscription && (
                        <Badge variant={subscription.variant}>{subscription.label}</Badge>
                      )}
                      {me?.isDemo && <Badge variant="warning">데모 계정</Badge>}
                    </div>
                  </>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="text-sm font-semibold text-foreground">{name}</span>
            <span className="text-xs font-normal text-muted-foreground">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate(`/${slug}/settings/password`)}>
            <KeyRound />
            비밀번호 변경
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/${slug}/settings`)}>
            <Settings />
            학원 설정
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => (window.location.href = `mailto:${SUPPORT_EMAIL}`)}>
          <MessageCircle />
          문의하기
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
