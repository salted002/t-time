import { LogOut } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'

import { AppSidebar } from '@/components/layout/AppSidebar'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { ADMIN_NAV } from '@/lib/navigation'

export function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    // TODO: AdminAuthContext가 생기면 운영자 토큰 삭제 로직으로 교체
    navigate('/admin/login', { replace: true })
  }

  return (
    <SidebarProvider className="theme-console">
      <AppSidebar
        sections={ADMIN_NAV}
        basePath="/admin"
        brand={{ name: '티타임', subtitle: '운영자 페이지' }}
        account={{ name: '플랫폼', role: '운영자' }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 bg-sidebar px-6 text-sidebar-foreground">
          <SidebarTrigger className="md:hidden" />
          <p className="text-sm font-semibold">티타임 운영자 페이지</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="ml-auto text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut />
            로그아웃
          </Button>
        </header>
        <main className="px-8 py-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
