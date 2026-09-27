import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

const COLUMNS_CLASS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
} as const

const SPAN_CLASS = {
  1: '',
  2: 'sm:col-span-2',
  3: 'sm:col-span-3',
} as const

export interface InfoItem {
  label: string
  value: ReactNode
  /** 긴 값(상담 내용, 메모)은 한 줄을 통째로 쓰게 columns와 같은 값을 준다 */
  span?: keyof typeof SPAN_CLASS
}

interface InfoGridProps {
  items: InfoItem[]
  columns?: keyof typeof COLUMNS_CLASS
}

export function InfoGrid({ items, columns = 3 }: InfoGridProps) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', COLUMNS_CLASS[columns])}>
      {items.map((item) => (
        <div key={item.label} className={cn('flex flex-col gap-1', SPAN_CLASS[item.span ?? 1])}>
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="text-sm font-medium whitespace-pre-wrap">{item.value ?? '-'}</dd>
        </div>
      ))}
    </dl>
  )
}
