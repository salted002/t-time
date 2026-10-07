import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GuideTooltip } from '@/components/layout/GuideTooltip'

interface PageHeaderProps {
  title: string
  /** 메뉴 제목 옆 ? 아이콘에 뜨는 도움말 */
  guide: string
  /** 목록 화면에서만: 사이드바 메뉴와 같은 아이콘 */
  icon?: LucideIcon
  description?: string
  actions?: ReactNode
  back?: { label: string; to: string }
}

export function PageHeader({
  title,
  guide,
  icon: Icon,
  description,
  actions,
  back,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-3">
      {back && (
        <Link
          to={back.to}
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {back.label}
        </Link>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground"
              >
                <Icon className="size-4.5" />
              </span>
            )}
            <h1 className="text-xl font-bold">{title}</h1>
            <GuideTooltip content={guide} />
          </div>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>

        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </header>
  )
}
