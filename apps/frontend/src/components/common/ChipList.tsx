import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export interface ChipItem {
  id: string
  label: string
}

interface ChipListProps {
  items: ChipItem[]
  /** 없으면 삭제(x) 버튼을 숨긴다 */
  onRemove?: (id: string) => void
  /** 칩 뒤에 붙는 추가 UI ([+ 추가] 입력, 학생 검색 등) */
  children?: ReactNode
}

export function ChipList({ items, onRemove, children }: ChipListProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <span
          key={item.id}
          className={cn(
            'inline-flex items-center gap-1 rounded-full bg-brand-soft py-1 text-xs font-semibold text-brand-soft-foreground',
            onRemove ? 'pr-1.5 pl-3' : 'px-3',
          )}
        >
          {item.label}
          {onRemove && (
            <button
              type="button"
              aria-label={`${item.label} 삭제`}
              onClick={() => onRemove(item.id)}
              className="flex size-4 items-center justify-center rounded-full hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      {children}
    </div>
  )
}
