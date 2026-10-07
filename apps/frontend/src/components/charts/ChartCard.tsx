import { useState, type ReactNode } from 'react'
import { ChartColumn, Table as TableIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description?: string
  /** 제목 아래 핵심 수치 (ChartSummary) */
  summary?: ReactNode
  chart: ReactNode
  /** 같은 데이터를 표로 보여주는 뷰 (색을 구분하기 어려운 사람, 정확한 숫자가 필요한 경우) */
  table: ReactNode
}

const VIEWS = [
  { key: 'chart', label: '그래프', icon: ChartColumn },
  { key: 'table', label: '표', icon: TableIcon },
] as const

export function ChartCard({ title, description, summary, chart, table }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {summary}
        </div>
        <div className="inline-flex rounded-lg bg-muted p-0.5" role="group" aria-label="보기 방식">
          {VIEWS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={cn(
                'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors',
                view === key
                  ? 'bg-card text-brand shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === 'chart' ? chart : table}
    </section>
  )
}

const CHIP_TONE = {
  brand: 'bg-brand-soft text-brand',
  gold: 'bg-chart-3/15 text-[#8A6A1F]',
  destructive: 'bg-destructive-soft text-destructive',
  muted: 'bg-muted text-muted-foreground',
} as const

interface ChartSummaryProps {
  value: string | number
  unit?: string
  chip?: string
  tone?: keyof typeof CHIP_TONE
  sub?: string
}

// 차트 카드 상단의 큰 숫자 + 증감 뱃지 + 한 줄 설명
export function ChartSummary({ value, unit, chip, tone = 'brand', sub }: ChartSummaryProps) {
  return (
    <div className="mt-2">
      <div className="flex items-baseline gap-2.5">
        <span className="text-[28px] leading-none font-extrabold tracking-tight tabular-nums">
          {value}
          {unit && <span className="ml-0.5 text-[15px] font-semibold">{unit}</span>}
        </span>
        {chip && (
          <span
            className={cn(
              'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold',
              CHIP_TONE[tone],
            )}
          >
            {chip}
          </span>
        )}
      </div>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
