import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { AuthMeProvider } from '@/context/AuthMeContext'
import { ACADEMY_NAV } from '@/lib/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthMe } from '@/hooks/useAuthMe'
import ProtectedRoute from '@/router/ProtectedRoute'

// ProtectedRoute 안쪽에 Provider를 두어서, 로그인한 뒤에만 /auth/me를 요청한다.
export function AppLayout() {
  return (
    <ProtectedRoute>
      <AuthMeProvider>
        <AppLayoutContent />
      </AuthMeProvider>
    </ProtectedRoute>
  )
}

function AppLayoutContent() {
  const { slug } = useParams()
  const { user, logout } = useAuth()
  const { me } = useAuthMe()
  const navigate = useNavigate()
  const userName = user?.name ?? '관리자'

  // /auth/me가 오기 전에는 이름을 비워 둔다(다른 학원 이름이 잠깐 보이는 것보다 낫다).
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
      <SidebarInset className="min-w-0">
        <AppHeader userName={userName} userEmail={user?.email ?? ''} onLogout={handleLogout} />
        <div className="px-4 py-6 md:px-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
