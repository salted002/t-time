import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { formatPhone } from '@/lib/phone'

export function PhoneInput({ value, onChange, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      inputMode="tel"
      value={formatPhone(String(value ?? ''))}   // 기존 데이터(하이픈 유무 상관없이)도 같은 모양으로 보임
      onChange={(e) => {
        e.target.value = formatPhone(e.target.value)
        onChange?.(e)
      }}
    />
  )
}
