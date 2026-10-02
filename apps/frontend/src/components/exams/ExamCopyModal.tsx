import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { DatePicker } from '@/components/common/DatePicker'
import { FormDialog } from '@/components/common/FormDialog'
import { FormField } from '@/components/common/FormField'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { examApi } from '@/api/examApi'
import { useClassList } from '@/hooks/useClassList'
import { useExam } from '@/hooks/useExam'
import { EVAL_TYPE_LABEL } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import type { ExamDetail, ExamSummary } from '@/types/exam'
import { examCopyFormSchema, type ExamCopyFormValues } from '@/types/examForm'

const FORM_ID = 'exam-copy-form'

interface ExamCopyModalProps {
  exam: ExamSummary
  onClose: () => void
  onCopied: (newExamId: string) => void
}

// 시험복사모달 (SCR-EXAM-COPY). 열 때마다 새로 마운트해서 쓴다.
export function ExamCopyModal({ exam, onClose, onCopied }: ExamCopyModalProps) {
  const { data: detail, loading, error } = useExam(exam.id)
  const { classes } = useClassList()

  const { control, handleSubmit, formState } = useForm<ExamCopyFormValues>({
    resolver: zodResolver(examCopyFormSchema),
    defaultValues: { classId: '', examDate: null, name: '' },
  })
  const { isSubmitting } = formState

  const classItems = classes.map((item) => ({ value: item.id, label: item.name }))

  const onSubmit = handleSubmit(async (values) => {
    try {
      const created = await examApi.copy(exam.id, {
        classId: values.classId,
        examDate: values.examDate ?? '',
        name: values.name.trim(),
      })
      toast.success('시험이 생성되었습니다.')
      onCopied(created.id)
    } catch (e) {
      toast.error(getErrorMessage(e, '시험을 복사하지 못했습니다.'))
    }
  })

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
      title={`${exam.name} 복사하기`}
      primary={{
        label: '복사하기',
        form: FORM_ID,
        loading: isSubmitting,
        disabled: loading || Boolean(error),
      }}
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormField control={control} name="classId" label="응시반" required>
          {(field) => (
            <Select
              items={classItems}
              value={field.value || null}
              onValueChange={(value) => field.onChange((value as string | null) ?? '')}
            >
              <SelectTrigger id={field.id} className="w-full" aria-invalid={field['aria-invalid']}>
                <SelectValue placeholder="반 선택" />
              </SelectTrigger>
              <SelectContent>
                {classItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={control} name="examDate" label="시험일자" required>
          {(field) => <DatePicker id={field.id} value={field.value} onChange={field.onChange} />}
        </FormField>

        <FormField control={control} name="name" label="시험이름(범위)" required>
          {(field) => <Input {...field} placeholder="예: 10월 정기고사" />}
        </FormField>

        <CopyPreview detail={detail} loading={loading} error={error} />
      </form>
    </FormDialog>
  )
}

function CopyPreview({
  detail,
  loading,
  error,
}: {
  detail: ExamDetail | null | undefined
  loading: boolean
  error: string | null
}) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-sm">
      <p className="mb-2 font-medium">복사될 내용</p>
      {loading && <Skeleton className="h-4 w-48" />}
      {error && <p className="text-destructive">{error}</p>}
      {detail && (
        <dl className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted-foreground">평가방식</dt>
            <dd>{EVAL_TYPE_LABEL[detail.evalType]}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted-foreground">과목</dt>
            <dd>
              {detail.subjects
                .map((s) => (s.maxScore === null ? s.name : `${s.name}(${s.maxScore})`))
                .join(', ')}
            </dd>
          </div>
          {detail.evalType === 'grade' && (
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-muted-foreground">등급</dt>
              <dd>
                {[...detail.grades]
                  .sort((a, b) => a.order - b.order)
                  .map((g) => g.label)
                  .join(' > ')}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
