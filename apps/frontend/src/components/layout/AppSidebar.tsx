import { Link, matchPath, useLocation, useParams } from 'react-router-dom'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { NavSection } from '@/lib/navigation'

interface AppSidebarProps {
  sections: NavSection[]
  brand: { name: string; subtitle: string; logoUrl?: string | null }
  account: { name: string }
}

export function AppSidebar({ sections, brand, account }: AppSidebarProps) {
  const { slug } = useParams()
  const { pathname } = useLocation()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar className="rounded-md">
            <AvatarImage src={brand.logoUrl ?? undefined} alt="" />
            <AvatarFallback className="rounded-md">{brand.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold">{brand.name}</span>
            <span className="text-xs opacity-60">{brand.subtitle}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const href = `/${slug}/${item.to}`
                  const isActive = matchPath({ path: href, end: false }, pathname) !== null

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link to={href} />}
                        className="relative data-active:before:absolute data-active:before:inset-y-2 data-active:before:-left-2 data-active:before:w-1 data-active:before:rounded-full data-active:before:bg-sidebar-primary"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-3 text-sm">{account.name} · 관리자</div>
      </SidebarFooter>
    </Sidebar>
  )
}
