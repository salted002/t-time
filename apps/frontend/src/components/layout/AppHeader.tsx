import { SidebarTrigger } from '@/components/ui/sidebar'
import { AcademyProfileDropdown } from '@/components/layout/AcademyProfileDropdown'
import type { AuthMe } from '@/hooks/useAuthMe'

interface AppHeaderProps {
  me: AuthMe | null
  meLoading: boolean
  userName: string
  userEmail: string
  onLogout: () => void
}

export function AppHeader({ me, meLoading, userName, userEmail, onLogout }: AppHeaderProps) {
  const displayName = me?.user.name ?? userName

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-card px-6">
      <SidebarTrigger className="md:hidden" />
      <p className="text-sm font-semibold">{displayName} 관리자님, 안녕하세요</p>
      <div className="ml-auto">
        <AcademyProfileDropdown
          me={me}
          loading={meLoading}
          fallbackName={userName}
          fallbackEmail={userEmail}
          onLogout={onLogout}
        />
      </div>
    </header>
  )
}
