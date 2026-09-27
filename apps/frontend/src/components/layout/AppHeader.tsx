import { SidebarTrigger } from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface AppHeaderProps {
  userName: string
}

export function AppHeader({ userName }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-card px-6">
      <SidebarTrigger className="md:hidden" />

      <p className="text-sm font-semibold">{userName} 관리자님, 안녕하세요</p>

      <div className="ml-auto">
        {/* TODO(4단계): ProfileDropdown으로 교체 */}
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            {userName.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
