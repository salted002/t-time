import type { ReactNode } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useConfirm } from '@/hooks/useConfirm'

interface SlidePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  /** 있으면 닫기 전에 확인창을 띄운다 (저장 안 한 리포트 등) */
  confirmOnClose?: { title: string; description?: string }
}

export function SlidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  confirmOnClose,
}: SlidePanelProps) {
  const confirm = useConfirm()

  const handleOpenChange = async (next: boolean) => {
    if (next || !confirmOnClose) {
      onOpenChange(next)
      return
    }
    const ok = await confirm({ ...confirmOnClose, confirmLabel: '나가기', tone: 'destructive' })
    if (ok) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none md:data-[side=right]:w-[55vw] md:min-w-140"
      >
        <SheetHeader className="border-b px-6 py-5 pr-12">
          <SheetTitle className="text-base font-semibold">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <SheetFooter className="border-t px-6 py-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}
