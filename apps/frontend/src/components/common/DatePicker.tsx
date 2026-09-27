import { useState } from 'react'
import { format, parse } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const VALUE_FORMAT = 'yyyy-MM-dd'
const DISPLAY_FORMAT = 'yyyy.MM.dd'

interface DatePickerProps {
  /** API와 같은 'yyyy-MM-dd' 문자열. 선택 안 함이면 null */
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  id?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  id,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const date = value ? parse(value, VALUE_FORMAT, new Date()) : undefined

  const select = (next: string | null) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-start font-normal tabular-nums"
          />
        }
      >
        <CalendarIcon className="text-muted-foreground" />
        {date ? (
          format(date, DISPLAY_FORMAT)
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => select(d ? format(d, VALUE_FORMAT) : null)}
        />
        {value && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => select(null)}
            >
              선택 안 함
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
