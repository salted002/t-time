import { Link, matchPath, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
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
import { BrandMark } from '@/components/common/BrandMark'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { NavSection } from '@/lib/navigation'

interface AppSidebarProps {
  sections: NavSection[]
  /** 메뉴 경로 앞에 붙일 주소. 학원: `/hanbit`, 운영자: `/admin` */
  basePath: string
  brand: { name: string; subtitle: string; logoUrl?: string | null }
  account: { name: string; role: string }
  /** 학원 구독 상태. 넘기면 푸터에 플랜 카드를 표시 */
  plan?: 'FREE' | 'SUBSCRIBED'
}

export function AppSidebar({ sections, basePath, brand, account, plan }: AppSidebarProps) {
  const { pathname } = useLocation()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-3 pt-4 pb-1">
          <BrandMark textClassName="text-[#F5EDE0]" />
        </div>
        <div className="mx-1 mt-2 flex items-center gap-3 rounded-lg border border-sidebar-border bg-white/10 px-3 py-2.5">
          <Avatar className="rounded-md">
            <AvatarImage src={brand.logoUrl ?? undefined} alt="" />
            <AvatarFallback className="rounded-md">{brand.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold">{brand.name}</span>
            <span className="text-xs opacity-60">{brand.subtitle}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section, i) => (
          <SidebarGroup key={section.label ?? i}>
            {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const href = `${basePath}/${item.to}`
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
        {plan ? (
          <Link
            to={`${basePath}/subscription`}
            className="m-2 rounded-lg border border-sidebar-border bg-white/10 p-3 transition-colors hover:bg-white/15"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sidebar-primary">
              <Sparkles className="size-3.5" />
              {plan === 'SUBSCRIBED' ? 'AI PRO 플랜' : 'FREE 플랜'}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed opacity-80">
              {plan === 'SUBSCRIBED'
                ? 'AI 피드백을 사용 중입니다.'
                : 'AI 피드백과 분석을 쓰려면 구독하세요.'}
            </p>
          </Link>
        ) : (
          <div className="px-2 py-3 text-sm">
            {account.name} · {account.role}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
