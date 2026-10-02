import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { PreviewItem } from '@/hooks/usePreviewQueue'

interface ResultCardListProps {
  items: PreviewItem[]
  checkedIds: string[]
  onCheckedChange: (checkedIds: string[]) => void
  onOpen: (studentId: string) => void
  onRetry: (studentId: string) => void
}

// 리포트생성결과목록 (SCR-REPORT-RESULT-LIST): 학생별 카드 + 체크박스 + 전체선택
export function ResultCardList({
  items,
  checkedIds,
  onCheckedChange,
  onOpen,
  onRetry,
}: ResultCardListProps) {
  const doneIds = items.filter((item) => item.status === 'done').map((item) => item.studentId)
  const allChecked = doneIds.length > 0 && doneIds.every((id) => checkedIds.includes(id))

  const toggle = (studentId: string) =>
    onCheckedChange(
      checkedIds.includes(studentId)
        ? checkedIds.filter((id) => id !== studentId)
        : [...checkedIds, studentId],
    )

  return (
    <div className="flex flex-col gap-4">
      <label className="flex w-fit items-center gap-2 text-sm font-medium">
        <Checkbox
          checked={allChecked}
          disabled={doneIds.length === 0}
          onCheckedChange={() => onCheckedChange(allChecked ? [] : doneIds)}
        />
        전체 선택
      </label>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const done = item.status === 'done'

          return (
            <li
              key={item.studentId}
              className={cn(
                'flex flex-col gap-3 rounded-lg border bg-card p-4',
                done && 'cursor-pointer hover:bg-muted/40',
              )}
              onClick={done ? () => onOpen(item.studentId) : undefined}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={checkedIds.includes(item.studentId)}
                  disabled={!done}
                  onCheckedChange={() => toggle(item.studentId)}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`${item.studentName} 선택`}
                />
                <span className="font-medium">{item.studentName}</span>
              </div>

              {item.status === 'loading' && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  생성 중...
                </p>
              )}

              {done && (
                <p className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-success" />
                  생성 완료
                  <span className="text-xs text-muted-foreground">(눌러서 미리보기)</span>
                </p>
              )}

              {item.status === 'error' && (
                <div className="flex flex-col gap-2">
                  <p className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>생성 실패 · {item.error}</span>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => onRetry(item.studentId)}
                  >
                    재시도
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
