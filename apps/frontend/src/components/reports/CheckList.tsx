import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

export interface CheckListItem {
  id: string
  label: string
  description?: string
}

interface CheckListProps {
  items: CheckListItem[]
  checkedIds: string[]
  onChange: (checkedIds: string[]) => void
  emptyText: string
}

// 검색으로 걸러진 목록 안에서만 동작하는 [전체 선택] + 체크 목록.
// 걸러진 목록 밖에서 이미 선택한 항목은 유지한다.
export function CheckList({ items, checkedIds, onChange, emptyText }: CheckListProps) {
  const checked = new Set(checkedIds)
  const allChecked = items.length > 0 && items.every((item) => checked.has(item.id))

  const toggle = (id: string) =>
    onChange(checked.has(id) ? checkedIds.filter((value) => value !== id) : [...checkedIds, id])

  const toggleAll = () => {
    if (allChecked) {
      const visible = new Set(items.map((item) => item.id))
      onChange(checkedIds.filter((id) => !visible.has(id)))
      return
    }
    onChange([...new Set([...checkedIds, ...items.map((item) => item.id)])])
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex w-fit items-center gap-2 text-sm font-medium">
        <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
        전체 선택
      </label>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border-[1.5px] px-3.5 py-3 text-sm transition-colors',
                checked.has(item.id)
                  ? 'border-primary bg-brand-soft'
                  : 'bg-card hover:border-primary/50 hover:bg-muted/50',
              )}
            >
              <Checkbox checked={checked.has(item.id)} onCheckedChange={() => toggle(item.id)} />
              <span className="font-semibold">{item.label}</span>
              {item.description && (
                <span className="text-xs text-muted-foreground">{item.description}</span>
              )}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
