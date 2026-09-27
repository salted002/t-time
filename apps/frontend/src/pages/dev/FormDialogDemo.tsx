import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { DatePicker } from '@/components/common/DatePicker'
import { FormDialog } from '@/components/common/FormDialog'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const demoSchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.'),
  school: z.string().min(1, '학교를 입력해 주세요.'),
  parentPhone: z.string().regex(/^01[0-9]-\d{3,4}-\d{4}$/, '010-0000-0000 형식으로 입력해 주세요.'),
  enrolledAt: z.string().nullable(),
})

type DemoValues = z.infer<typeof demoSchema>

const DEFAULT_VALUES: DemoValues = { name: '', school: '', parentPhone: '', enrolledAt: null }

export function FormDialogDemo() {
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [result, setResult] = useState<DemoValues | null>(null)

  const form = useForm<DemoValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) form.reset(DEFAULT_VALUES)
  }

  const onSubmit = async (values: DemoValues) => {
    await new Promise((r) => setTimeout(r, 800)) // API 호출 흉내
    setResult(values)
    handleOpenChange(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button onClick={() => setOpen(true)}>폼 모달 열기</Button>
        <Button variant="outline" onClick={() => setDetailOpen(true)}>
          버튼 없는 상세 모달 열기
        </Button>
      </div>
      <pre className="rounded-md bg-muted p-3 text-xs">
        {result ? JSON.stringify(result, null, 2) : '제출 결과 없음'}
      </pre>

      <FormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="학생 등록"
        primary={{ label: '등록', form: 'demo-form', loading: form.formState.isSubmitting }}
        danger={{ label: '삭제 (배치 확인용)', onClick: () => handleOpenChange(false) }}
      >
        <form id="demo-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField control={form.control} name="name" label="이름" required>
            {(field) => <Input {...field} placeholder="학생 이름" />}
          </FormField>
          <FormField control={form.control} name="school" label="학교" required>
            {(field) => <Input {...field} placeholder="부평중" />}
          </FormField>
          <FormField
            control={form.control}
            name="parentPhone"
            label="학부모연락처"
            required
            description="하이픈(-)을 포함해 입력해 주세요."
          >
            {(field) => <Input {...field} placeholder="010-0000-0000" inputMode="tel" />}
          </FormField>
          <FormField control={form.control} name="enrolledAt" label="등록일자">
            {(field) => (
              <DatePicker
                id={field.id}
                value={field.value}
                onChange={field.onChange}
                placeholder="선택 안 함"
              />
            )}
          </FormField>
        </form>
      </FormDialog>

      <FormDialog open={detailOpen} onOpenChange={setDetailOpen} title="발송 상세" cancel={false}>
        <p className="text-sm">버튼이 하나도 없으면 푸터 영역 자체가 없어야 해요.</p>
      </FormDialog>
    </div>
  )
}
