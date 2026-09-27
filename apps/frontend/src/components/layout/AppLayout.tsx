import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { ACADEMY_NAV } from '@/lib/navigation'
import { useAuth } from '@/hooks/useAuth'

export function AppLayout() {
  const { slug } = useParams()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const userName = user?.name ?? '관리자'

  // TODO: /auth/me가 생기면 useAuth()의 academy로 교체
  const academy = { name: '한빛영어학원', logoUrl: null }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <SidebarProvider>
      <AppSidebar
        sections={ACADEMY_NAV}
        basePath={`/${slug}`}
        brand={{ name: academy.name, subtitle: '관리자', logoUrl: academy.logoUrl }}
        account={{ name: userName, role: '관리자' }}
      />
      <SidebarInset>
        <AppHeader userName={userName} userEmail={user?.email ?? ''} onLogout={handleLogout} />
        <main className="px-8 py-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
