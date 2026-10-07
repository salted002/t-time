import { matchPath, useLocation, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ProfileDropdown } from '@/components/layout/ProfileDropdown'
import { ACADEMY_NAV } from '@/lib/navigation'

interface AppHeaderProps {
  userName: string
  userEmail: string
  onLogout: () => void
}

// 현재 주소에 해당하는 [섹션, 메뉴] 이름. 학생 상세처럼 하위 주소도 상위 메뉴로 잡힌다.
function useBreadcrumb(): string[] {
  const { pathname } = useLocation()
  const { slug } = useParams()

  for (const section of ACADEMY_NAV) {
    for (const item of section.items) {
      if (matchPath({ path: `/${slug}/${item.to}`, end: false }, pathname)) {
        return section.label ? [section.label, item.label] : [item.label]
      }
    }
  }
  return []
}

export function AppHeader({ userName, userEmail, onLogout }: AppHeaderProps) {
  const crumbs = useBreadcrumb()

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-card px-6">
      <SidebarTrigger className="md:hidden" />

      <nav aria-label="현재 위치" className="flex items-center gap-1 text-sm">
        {crumbs.map((label, i) => (
          <span key={label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 text-muted-foreground" />}
            <span className={i === crumbs.length - 1 ? 'font-semibold' : 'text-muted-foreground'}>
              {label}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm font-medium sm:inline">{userName} 님</span>
        <ProfileDropdown name={userName} email={userEmail} onLogout={onLogout} />
      </div>
    </header>
  )
}
