import type { LucideIcon } from 'lucide-react'
import { Building2 } from 'lucide-react'
import {
  Users,
  FileText,
  BarChart3,
  School,
  MessageSquareText,
  History,
  CreditCard,
  Settings,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}
export interface NavSection {
  label: string
  items: NavItem[]
}

export const ACADEMY_NAV: NavSection[] = [
  {
    label: '학사 관리',
    items: [
      { label: '학생 관리', to: 'students', icon: Users },
      { label: '시험 관리', to: 'exams', icon: FileText },
      { label: '리포트 관리', to: 'reports', icon: BarChart3 },
      { label: '반 관리', to: 'classes', icon: School },
    ],
  },
  {
    label: '발송 관리',
    items: [
      { label: '템플릿 관리', to: 'templates', icon: MessageSquareText },
      { label: '발송 이력', to: 'message-logs', icon: History },
    ],
  },
  {
    label: '설정',
    items: [
      { label: '구독 관리', to: 'subscription', icon: CreditCard },
      { label: '학원 설정', to: 'settings', icon: Settings },
    ],
  },
]

export const ADMIN_NAV: NavSection[] = [
  {
    label: '운영자 콘솔',
    items: [{ label: '학원 관리', to: 'academies', icon: Building2 }],
  },
]
