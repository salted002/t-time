import logoIcon from '@/assets/logo-icon-transparent.png'
import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  /** 글자색 등 텍스트 스타일 (어두운 배경에서는 text-white) */
  textClassName?: string
}

// 티타임 서비스 로고 (아이콘 + 서비스명)
export function BrandMark({ className, textClassName }: BrandMarkProps) {
  return (
    <span className={cn('flex items-center gap-2.5', className)} aria-label="티타임">
      <img src={logoIcon} alt="" className="size-9 shrink-0" />
      <span className={cn('flex flex-col leading-none', textClassName)}>
        <span className="font-brand text-[22px] font-bold tracking-tight">T-Time</span>
        <span className="mt-0.5 text-[11px] font-medium tracking-[0.12em] opacity-75">티타임</span>
      </span>
    </span>
  )
}
