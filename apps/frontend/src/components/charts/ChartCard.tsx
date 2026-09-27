import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'

interface ChartCardProps {
  title: string
  description?: string
  chart: ReactNode
  /** 같은 데이터를 표로 보여주는 뷰 (색을 구분하기 어려운 사람, 정확한 숫자가 필요한 경우) */
  table: ReactNode
}

export function ChartCard({ title, description, chart, table }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex gap-1" role="group" aria-label="보기 방식">
          <Button
            type="button"
            size="sm"
            variant={view === 'chart' ? 'secondary' : 'ghost'}
            aria-pressed={view === 'chart'}
            onClick={() => setView('chart')}
          >
            그래프
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === 'table' ? 'secondary' : 'ghost'}
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            표
          </Button>
        </div>
      </div>
      {view === 'chart' ? chart : table}
    </section>
  )
}
