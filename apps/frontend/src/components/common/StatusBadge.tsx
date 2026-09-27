import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import type { Tone } from '@/lib/constants'

const TONE_TO_VARIANT = {
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  info: 'info',
  muted: 'secondary',
} as const satisfies Record<Tone, string>

interface StatusBadgeProps {
  tone: Tone
  children: ReactNode
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return (
    <Badge variant={TONE_TO_VARIANT[tone]}>
      {tone !== 'muted' && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </Badge>
  )
}
