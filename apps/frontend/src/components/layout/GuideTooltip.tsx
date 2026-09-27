import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { CircleHelp } from 'lucide-react'

interface GuideTooltipProps {
  content: string
}

export function GuideTooltip({ content }: GuideTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label="도움말"
        className="inline-flex cursor-help items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <CircleHelp className="size-4" />
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{content}</TooltipContent>
    </Tooltip>
  )
}
