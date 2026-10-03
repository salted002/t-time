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
    <span className={cn('flex items-center gap-2', className)}>
      <img src={logoIcon} alt="" className="size-8 shrink-0" />
      <span className={cn('text-lg font-bold', textClassName)}>티타임</span>
    </span>
  )
}
