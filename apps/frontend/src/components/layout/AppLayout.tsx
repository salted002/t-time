import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { ACADEMY_NAV } from '@/lib/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthMe } from '@/hooks/useAuthMe'

export function AppLayout() {
  const { slug } = useParams()
  const { user, logout } = useAuth()
  const { me, loading: meLoading } = useAuthMe()
  const navigate = useNavigate()
  const userName = me?.user.name ?? user?.name ?? '관리자'
  const academy = { name: me?.academy.name ?? '', logoUrl: me?.academy.logoUrl ?? null }

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
        <AppHeader
          me={me}
          meLoading={meLoading}
          userName={user?.name ?? '관리자'}
          userEmail={user?.email ?? ''}
          onLogout={handleLogout}
        />
        <main className="px-8 py-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
