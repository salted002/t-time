import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { DatePicker } from '@/components/common/DatePicker'
import { FormDialog } from '@/components/common/FormDialog'
import { FormField } from '@/components/common/FormField'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { counselingApi } from '@/api/counselingApi'
import { getErrorMessage } from '@/lib/errors'
import {
  COUNSELING_TARGETS,
  counselingFormSchema,
  toCounselingPayload,
  type Counseling,
  type CounselingFormValues,
} from '@/types/counseling'

const FORM_ID = 'counseling-form'

interface CounselingFormModalProps {
  studentId: string
  /** 없으면 추가, 있으면 수정 */
  counseling?: Counseling
  onClose: () => void
  onSaved: () => void
}

// 학생상담추가모달 / 학생상담수정모달 (SCR-STU-COUNSEL-CREATE / UPDATE)
// 열 때마다 새로 마운트해서 쓴다.
export function CounselingFormModal({
  studentId,
  counseling,
  onClose,
  onSaved,
}: CounselingFormModalProps) {
  const isUpdate = Boolean(counseling)

  const { control, handleSubmit, formState } = useForm<CounselingFormValues>({
    resolver: zodResolver(counselingFormSchema),
    defaultValues: {
      counselingDate: counseling?.counselingDate ?? null,
      target: counseling?.target ?? '학생',
      counselorName: counseling?.counselorName ?? '',
      content: counseling?.content ?? '',
      note: counseling?.note ?? '',
    },
  })
  const { isSubmitting } = formState

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toCounselingPayload(values)
      if (counseling) {
        await counselingApi.update(studentId, counseling.id, payload)
        toast.success('상담 기록이 수정되었습니다.')
      } else {
        await counselingApi.create(studentId, payload)
        toast.success('상담 기록이 저장되었습니다.')
      }
      onSaved()
      onClose()
    } catch (e) {
      toast.error(getErrorMessage(e, '상담 기록을 저장하지 못했습니다.'))
    }
  })

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      title={isUpdate ? '상담 수정' : '상담 추가'}
      primary={{ label: '저장하기', form: FORM_ID, loading: isSubmitting }}
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormField control={control} name="counselingDate" label="상담일" required>
          {(field) => <DatePicker id={field.id} value={field.value} onChange={field.onChange} />}
        </FormField>

        <FormField control={control} name="target" label="대상" required>
          {(field) => (
            <RadioGroup
              id={field.id}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              className="flex gap-6"
            >
              {COUNSELING_TARGETS.map((target) => (
                <label key={target} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={target} />
                  {target}
                </label>
              ))}
            </RadioGroup>
          )}
        </FormField>

        <FormField control={control} name="counselorName" label="상담자명" required>
          {(field) => <Input {...field} placeholder="예: 박선생님" />}
        </FormField>

        <FormField control={control} name="content" label="상담 내용" required>
          {(field) => <Textarea {...field} rows={7} placeholder="상담 내용을 입력하세요." />}
        </FormField>

        <FormField
          control={control}
          name="note"
          label="내부공유용 메모"
          description="학부모에게 공유되지 않는 참고사항입니다."
        >
          {(field) => <Textarea {...field} rows={3} />}
        </FormField>
      </form>
    </FormDialog>
  )
}
