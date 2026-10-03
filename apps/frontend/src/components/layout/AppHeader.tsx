import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ProfileDropdown } from '@/components/layout/ProfileDropdown'
import { BrandMark } from '../common/BrandMark'

interface AppHeaderProps {
  userName: string
  userEmail: string
  onLogout: () => void
}

export function AppHeader({ userName, userEmail, onLogout }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-card px-6">
      <SidebarTrigger className="md:hidden" />
      <BrandMark textClassName="text-primary" />
      <Separator orientation="vertical" className="my-auto h-5" />
      <p className="text-sm font-semibold">{userName} 관리자님, 안녕하세요</p>
      <div className="ml-auto">
        <ProfileDropdown name={userName} email={userEmail} onLogout={onLogout} />
      </div>
    </header>
  )
}
