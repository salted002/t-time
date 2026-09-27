import type { ReactNode } from 'react'

interface SectionCardProps {
  title?: string
  description?: string
  /** 섹션 오른쪽 위 버튼 (예: [시험 정보 수정]) */
  actions?: ReactNode
  children: ReactNode
}

export function SectionCard({ title, description, actions, children }: SectionCardProps) {
  const hasHeader = Boolean(title || actions)

  return (
    <section className="rounded-lg border bg-card p-6">
      {hasHeader && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
