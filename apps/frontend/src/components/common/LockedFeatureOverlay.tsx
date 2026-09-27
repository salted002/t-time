import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'

interface LockedFeatureOverlayProps {
  locked: boolean
  title: string
  description: string
  /** 예: <Link to=".../subscription">구독 관리로</Link> */
  action?: ReactNode
  children: ReactNode
}

export function LockedFeatureOverlay({
  locked,
  title,
  description,
  action,
  children,
}: LockedFeatureOverlayProps) {
  if (!locked) return <>{children}</>

  return (
    <div className="relative min-h-44 overflow-hidden rounded-lg border">
      <div aria-hidden inert className="pointer-events-none opacity-50 blur-sm select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 p-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
          <Lock className="size-5" />
        </div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  )
}
