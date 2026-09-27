import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const SIZE_CLASS = {
  sm: 'sm:max-w-[400px]',
  md: 'sm:max-w-[520px]',
  lg: 'sm:max-w-[720px]',
} as const

interface DialogAction {
  label: string
  onClick?: () => void
  /** 푸터 버튼으로 본문의 <form id="...">을 제출할 때 그 form의 id */
  form?: string
  loading?: boolean
  disabled?: boolean
}

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  size?: keyof typeof SIZE_CLASS
  children: ReactNode
  /** 오른쪽 끝 주요 버튼 */
  primary?: DialogAction
  /** 주요 버튼 왼쪽 취소 버튼 문구. false면 버튼 없음 */
  cancel?: string | false
  /** 왼쪽 끝 삭제 등 파괴적 버튼 */
  danger?: DialogAction
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  primary,
  cancel = '취소',
  danger,
}: FormDialogProps) {
  const hasFooter = Boolean(primary || danger || cancel !== false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('flex max-h-[calc(100dvh-4rem)] flex-col gap-0 p-0', SIZE_CLASS[size])}
      >
        <DialogHeader className="border-b px-6 py-5 pr-12">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {hasFooter && (
          <DialogFooter className="border-t px-6 py-4 sm:justify-between">
            <div>
              {danger && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={danger.onClick}
                  disabled={danger.disabled || danger.loading}
                >
                  {danger.loading && <Loader2 className="animate-spin" />}
                  {danger.label}
                </Button>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {cancel !== false && (
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {cancel}
                </Button>
              )}
              {primary && (
                <Button
                  type={primary.form ? 'submit' : 'button'}
                  form={primary.form}
                  onClick={primary.onClick}
                  disabled={primary.disabled || primary.loading}
                >
                  {primary.loading && <Loader2 className="animate-spin" />}
                  {primary.label}
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
