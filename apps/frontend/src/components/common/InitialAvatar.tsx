import { cn } from '@/lib/utils'

interface InitialAvatarProps {
  name: string
  className?: string
}

// 이름 첫 글자를 보여주는 동그란 아바타 (목록에서 이름 앞에 붙이는 용도)
export function InitialAvatar({ name, className }: InitialAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7.5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-soft-foreground',
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  )
}
