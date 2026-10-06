import { useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquare, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { examApi } from '@/api/examApi'
import { useConfirm } from '@/hooks/useConfirm'
import { useExam } from '@/hooks/useExam'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/errors'
import { formatScore } from '@/lib/format'
import type { ExamDetail } from '@/types/exam'
import {
  createExamResultSchema,
  toResultFormValues,
  toResultsPayload,
  type ExamResultFormValues,
} from '@/types/examResultForm'
import { PAGE_TEXT } from '@/lib/pageText'

const NONE = 'none' // 등급 미입력 선택지

// 성적입력페이지(SCR-EXAM-RESULT-INPUT) / 성적수정페이지(SCR-EXAM-RESULT-UPDATE)
export default function ExamResultFormPage() {
  const { slug, examId } = useParams<{ slug: string; examId: string }>()
  const { data: exam, loading, error } = useExam(examId ?? null)

  const detailPath = `/${slug}/exams/${examId}`

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
          title="성적 입력"
          guide={PAGE_TEXT.EXAM_RESULT_FORM.guide}
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

  return <ResultForm exam={exam} detailPath={detailPath} />
}

interface ResultFormProps {
  exam: ExamDetail
  detailPath: string
}

function ResultForm({ exam, detailPath }: ResultFormProps) {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const isGrade = exam.evalType === 'grade'

  // 입력된 성적이 하나도 없으면 "입력", 있으면 "수정"
  const hasResults = exam.participants.some((participant) =>
    participant.scores.some((cell) => cell.score !== null || cell.gradeId !== null),
  )
  const title = `${exam.name} 성적 ${hasResults ? '수정' : '입력'}`

  const form = useForm<ExamResultFormValues>({
    resolver: zodResolver(createExamResultSchema(exam)),
    defaultValues: toResultFormValues(exam),
  })
  const { control, register, setValue, formState } = form
  const { errors, isSubmitting, isDirty } = formState

  const { fields } = useFieldArray({ control, name: 'participants' })
  const rows = useWatch({ control, name: 'participants' })

  const gradeItems = [
    { value: NONE, label: '-' },
    ...[...exam.grades]
      .sort((a, b) => a.order - b.order)
      .map((grade) => ({ value: grade.id, label: grade.label })),
  ]

  const setIncluded = (index: number, included: boolean) =>
    setValue(`participants.${index}.included`, included, { shouldDirty: true })

  const includedCount = rows.filter((row) => row.included).length
  const excludedRows = rows.map((row, index) => ({ row, index })).filter(({ row }) => !row.included)

  // 만점 초과 등 입력 오류를 표 아래에 모아서 보여준다.
  const errorMessages = fields.flatMap((_, rowIndex) =>
    exam.subjects.flatMap((subject, subjectIndex) => {
      const message = errors.participants?.[rowIndex]?.scores?.[subjectIndex]?.message
      return message ? [`${rows[rowIndex]?.studentName} · ${subject.name}: ${message}`] : []
    }),
  )

  const handleCancel = async () => {
    if (isDirty) {
      const ok = await confirm({
        title: '저장하지 않고 나갈까요?',
        description: '입력한 내용이 저장되지 않습니다.',
        confirmLabel: '나가기',
        tone: 'destructive',
      })
      if (!ok) return
    }
    navigate(detailPath)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await examApi.saveResults(exam.id, toResultsPayload(values, exam))
      toast.success('저장되었습니다.')
      navigate(detailPath)
    } catch (e) {
      toast.error(getErrorMessage(e, '성적을 저장하지 못했습니다.'))
    }
  })

  return (
    <div>
      <PageHeader
        title={title}
        guide="점수나 등급을 비워 두면 미응시로 처리되어 반 통계에서 제외됩니다(0점과 다릅니다). x로 응시자에서 제외하고, 아래 목록에서 다시 추가할 수 있습니다."
        description={
          exam.className ? `${exam.className} · 응시 ${includedCount}명` : `응시 ${includedCount}명`
        }
        back={{ label: '시험 상세로', to: detailPath }}
      />

      <form onSubmit={onSubmit} noValidate>
        <SectionCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>학생명</TableHead>
                {exam.subjects.map((subject) => (
                  <TableHead key={subject.id} className="text-right">
                    {subject.name}
                    {subject.maxScore !== null && (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        ({formatScore(subject.maxScore)})
                      </span>
                    )}
                  </TableHead>
                ))}
                <TableHead className="w-16 text-center">피드백</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {includedCount === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={exam.subjects.length + 2}
                    className="text-center text-muted-foreground"
                  >
                    응시 학생이 없습니다.
                  </TableCell>
                </TableRow>
              )}

              {fields.map((field, rowIndex) => {
                const row = rows[rowIndex]
                if (!row?.included) return null

                return (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {row.studentName}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`${row.studentName} 응시자에서 제외`}
                          onClick={() => setIncluded(rowIndex, false)}
                        >
                          <X />
                        </Button>
                      </div>
                    </TableCell>

                    {exam.subjects.map((subject, subjectIndex) => {
                      const path = `participants.${rowIndex}.scores.${subjectIndex}` as const
                      const invalid = !!errors.participants?.[rowIndex]?.scores?.[subjectIndex]

                      return (
                        <TableCell key={subject.id} className="text-right">
                          {isGrade ? (
                            <Select
                              items={gradeItems}
                              value={row.scores[subjectIndex] || NONE}
                              onValueChange={(value) =>
                                setValue(path, value === NONE ? '' : (value as string), {
                                  shouldDirty: true,
                                })
                              }
                            >
                              <SelectTrigger
                                className="ml-auto w-24"
                                aria-label={`${row.studentName} ${subject.name} 등급`}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {gradeItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              {...register(path)}
                              inputMode="decimal"
                              placeholder="--"
                              aria-label={`${row.studentName} ${subject.name} 점수`}
                              aria-invalid={invalid}
                              className="ml-auto w-20 text-right tabular-nums"
                            />
                          )}
                        </TableCell>
                      )
                    })}

                    <TableCell className="text-center">
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`${row.studentName} 선생님 피드백`}
                            />
                          }
                        >
                          <MessageSquare
                            className={cn(
                              row.teacherComment.trim() && 'fill-primary/20 text-primary',
                            )}
                          />
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72">
                          <Textarea
                            {...register(`participants.${rowIndex}.teacherComment`)}
                            rows={4}
                            placeholder="선생님 피드백"
                            aria-label={`${row.studentName} 선생님 피드백`}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {errorMessages.length > 0 && (
            <ul role="alert" className="mt-4 flex flex-col gap-1 text-sm text-destructive">
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}

          {excludedRows.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">제외한 학생 (눌러서 다시 추가)</p>
              <div className="flex flex-wrap gap-2">
                {excludedRows.map(({ row, index }) => (
                  <Button
                    key={fields[index].id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIncluded(index, true)}
                  >
                    <Plus />
                    {row.studentName}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-2 border-t pt-5">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              저장
            </Button>
          </div>
        </SectionCard>
      </form>
    </div>
  )
}
