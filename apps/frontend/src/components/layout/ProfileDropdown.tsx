import { KeyRound, LogOut, MessageCircle, Settings } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SUPPORT_EMAIL } from '@/lib/constants'

interface ProfileDropdownProps {
  name: string
  email: string
  onLogout: () => void
}

export function ProfileDropdown({ name, email, onLogout }: ProfileDropdownProps) {
  const navigate = useNavigate()
  const { slug } = useParams()

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

      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
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
  )
}
