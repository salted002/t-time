import { useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { DatePicker } from '@/components/common/DatePicker'
import { FormField } from '@/components/common/FormField'
import { Button } from '@/components/ui/button'
import { FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { examApi } from '@/api/examApi'
import { useClassList } from '@/hooks/useClassList'
import { useExam } from '@/hooks/useExam'
import { EVAL_TYPE_LABEL } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import type { EvalType, ExamDetail } from '@/types/exam'
import {
  EXAM_MAX_GRADES,
  EXAM_MAX_SUBJECTS,
  createExamFormSchema,
  toCreatePayload,
  toUpdatePayload,
  type ExamFormMode,
  type ExamFormValues,
} from '@/types/examForm'

const EVAL_TYPES = Object.keys(EVAL_TYPE_LABEL) as EvalType[]

const CREATE_DEFAULTS: ExamFormValues = {
  examDate: null,
  classId: '',
  name: '',
  evalType: 'score',
  subjects: [{ name: '', maxScore: '' }],
  grades: [{ label: '' }],
  memo: '',
}

function toFormValues(exam: ExamDetail): ExamFormValues {
  return {
    examDate: exam.examDate,
    classId: exam.classId ?? '',
    name: exam.name,
    evalType: exam.evalType,
    subjects: exam.subjects.map((subject) => ({
      subjectId: subject.id,
      name: subject.name,
      maxScore: subject.maxScore === null ? '' : String(subject.maxScore),
    })),
    grades: [...exam.grades]
      .sort((a, b) => a.order - b.order)
      .map((grade) => ({ label: grade.label })),
    memo: exam.memo ?? '',
  }
}

// 시험추가페이지(SCR-EXAM-CREATE) / 시험수정페이지(SCR-EXAM-UPDATE)
export default function ExamFormPage() {
  const { slug, examId } = useParams<{ slug: string; examId: string }>()
  const { data: exam, loading, error } = useExam(examId ?? null)

  if (!examId) return <ExamForm mode="create" slug={slug ?? ''} />

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div>
        <PageHeader
          title="시험 수정"
          guide="시험일자, 시험이름, 만점값, 메모를 수정할 수 있습니다."
          back={{ label: '시험 목록으로', to: `/${slug}/exams` }}
        />
        <SectionCard>
          <p className="text-sm text-muted-foreground">
            {error ?? '시험 정보를 찾을 수 없습니다.'}
          </p>
        </SectionCard>
      </div>
    )
  }

  return <ExamForm mode="edit" slug={slug ?? ''} exam={exam} />
}

interface ExamFormProps {
  mode: ExamFormMode
  slug: string
  exam?: ExamDetail
}

function ExamForm({ mode, slug, exam }: ExamFormProps) {
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const listPath = `/${slug}/exams`
  const backPath = isEdit && exam ? `${listPath}/${exam.id}` : listPath

  const { classes } = useClassList()

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(createExamFormSchema(mode)),
    defaultValues: exam ? toFormValues(exam) : CREATE_DEFAULTS,
  })
  const { control, register, formState } = form
  const { errors, isSubmitting } = formState

  const subjects = useFieldArray({ control, name: 'subjects' })
  const grades = useFieldArray({ control, name: 'grades' })

  const evalType = useWatch({ control, name: 'evalType' })
  const isScoreMax = evalType === 'score_max'
  const isGrade = evalType === 'grade'

  const classItems = classes.map((item) => ({ value: item.id, label: item.name }))

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit && exam) {
        await examApi.update(exam.id, toUpdatePayload(values))
        toast.success('수정되었습니다.')
        navigate(backPath)
        return
      }

      const created = await examApi.create(toCreatePayload(values))
      toast.success('시험이 생성되었습니다.')
      // TODO: 성적 입력 화면(SCR-EXAM-RESULT-INPUT) 구현 후 그쪽으로 이동
      navigate(`${listPath}/${created.id}`)
    } catch (e) {
      toast.error(
        getErrorMessage(e, isEdit ? '시험을 수정하지 못했습니다.' : '시험을 생성하지 못했습니다.'),
      )
    }
  })

  return (
    <div>
      <PageHeader
        title={isEdit ? '시험 수정' : '시험 추가'}
        guide={
          isEdit
            ? '시험일자, 시험이름, 만점값, 메모를 수정할 수 있습니다. 응시반·평가방식·과목·등급은 바꿀 수 없습니다.'
            : '시험 정보를 입력하면 응시반의 재원생이 응시자로 등록됩니다. 응시반, 평가방식, 과목, 등급은 저장 후 바꿀 수 없습니다.'
        }
        back={{ label: isEdit ? '시험 상세로' : '시험 목록으로', to: backPath }}
      />

      <form onSubmit={onSubmit} noValidate>
        <SectionCard>
          <FieldGroup className="max-w-2xl">
            <FormField control={control} name="examDate" label="시험일자" required>
              {(field) => (
                <DatePicker id={field.id} value={field.value} onChange={field.onChange} />
              )}
            </FormField>

            {isEdit ? (
              <FormField control={control} name="classId" label="응시반">
                {(field) => <Input id={field.id} value={exam?.className ?? '삭제된 반'} disabled />}
              </FormField>
            ) : (
              <FormField
                control={control}
                name="classId"
                label="응시반"
                required
                description={
                  classes.length === 0
                    ? '등록된 반이 없습니다. 반을 먼저 만들어 주세요.'
                    : undefined
                }
              >
                {(field) => (
                  <Select
                    items={classItems}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange((value as string | null) ?? '')}
                  >
                    <SelectTrigger
                      id={field.id}
                      className="w-full"
                      aria-invalid={field['aria-invalid']}
                    >
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
            )}

            <FormField control={control} name="name" label="시험이름(범위)" required>
              {(field) => <Input {...field} placeholder="예: 9월 정기고사" />}
            </FormField>

            <FormField control={control} name="evalType" label="평가방식" required>
              {(field) => (
                <RadioGroup
                  id={field.id}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  disabled={isEdit}
                  className="flex flex-wrap gap-x-6 gap-y-2"
                >
                  {EVAL_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={type} />
                      {EVAL_TYPE_LABEL[type]}
                    </label>
                  ))}
                </RadioGroup>
              )}
            </FormField>

            <div className="flex flex-col gap-2">
              <FieldLabel>
                시험과목
                <span aria-hidden className="text-destructive">
                  *
                </span>
                {isScoreMax && (
                  <span className="font-normal text-muted-foreground">(과목명 / 만점)</span>
                )}
              </FieldLabel>

              {subjects.fields.map((item, index) => {
                const rowErrors = errors.subjects?.[index]
                return (
                  <div key={item.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Input
                        {...register(`subjects.${index}.name`)}
                        placeholder={`과목 ${index + 1}`}
                        aria-label={`과목 ${index + 1} 이름`}
                        aria-invalid={!!rowErrors?.name}
                        disabled={isEdit}
                      />
                      {isScoreMax && (
                        <Input
                          {...register(`subjects.${index}.maxScore`)}
                          inputMode="decimal"
                          placeholder="만점"
                          aria-label={`과목 ${index + 1} 만점`}
                          aria-invalid={!!rowErrors?.maxScore}
                          className="w-28 shrink-0"
                        />
                      )}
                      {!isEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`과목 ${index + 1} 삭제`}
                          disabled={subjects.fields.length === 1}
                          onClick={() => subjects.remove(index)}
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                    <FieldError errors={[rowErrors?.name, rowErrors?.maxScore]} />
                  </div>
                )
              })}

              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  disabled={subjects.fields.length >= EXAM_MAX_SUBJECTS}
                  onClick={() => subjects.append({ name: '', maxScore: '' })}
                >
                  <Plus />
                  과목 추가 ({subjects.fields.length}/{EXAM_MAX_SUBJECTS})
                </Button>
              )}
            </div>

            {isGrade && (
              <div className="flex flex-col gap-2">
                <FieldLabel>
                  등급 라벨
                  <span aria-hidden className="text-destructive">
                    *
                  </span>
                  <span className="font-normal text-muted-foreground">
                    (최고 등급부터 순서대로)
                  </span>
                </FieldLabel>

                {grades.fields.map((item, index) => {
                  const rowError = errors.grades?.[index]?.label
                  return (
                    <div key={item.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Input
                          {...register(`grades.${index}.label`)}
                          placeholder={`등급 ${index + 1} (예: A)`}
                          aria-label={`등급 ${index + 1} 라벨`}
                          aria-invalid={!!rowError}
                          disabled={isEdit}
                        />
                        {!isEdit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`등급 ${index + 1} 삭제`}
                            disabled={grades.fields.length === 1}
                            onClick={() => grades.remove(index)}
                          >
                            <X />
                          </Button>
                        )}
                      </div>
                      <FieldError errors={[rowError]} />
                    </div>
                  )
                })}

                {!isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    disabled={grades.fields.length >= EXAM_MAX_GRADES}
                    onClick={() => grades.append({ label: '' })}
                  >
                    <Plus />
                    등급 추가 ({grades.fields.length}/{EXAM_MAX_GRADES})
                  </Button>
                )}
              </div>
            )}

            <FormField control={control} name="memo" label="내부공유용 메모">
              {(field) => <Textarea {...field} rows={3} />}
            </FormField>
          </FieldGroup>

          <div className="mt-8 flex justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(backPath)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? '저장' : '저장 후 성적 입력'}
            </Button>
          </div>
        </SectionCard>
      </form>
    </div>
  )
}
