import { Fragment } from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StepperProps {
  steps: string[]
  /** 현재 단계 (0부터) */
  current: number
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center">
      {steps.map((label, index) => {
        const done = index < current
        const active = index === current

        return (
          <Fragment key={label}>
            {index > 0 && (
              <li
                aria-hidden
                className={cn('mx-2 h-px w-10', done || active ? 'bg-ring' : 'bg-border')}
              />
            )}
            <li aria-current={active ? 'step' : undefined} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                  done && 'bg-ring text-primary-foreground',
                  active && 'bg-primary text-primary-foreground',
                  !done && !active && 'bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  'text-xs whitespace-nowrap',
                  done || active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
