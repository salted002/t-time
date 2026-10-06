import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { InfoGrid } from '@/components/common/InfoGrid'
import { ChipList } from '@/components/common/ChipList'
import { ScoreCompareChart } from '@/components/charts/ScoreCompareChart'
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart'
import { GradeDistributionChart } from '@/components/charts/GradeDistributionChart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { studentExamApi } from '@/api/studentExamApi'
import { useStudentExam } from '@/hooks/useStudentExam'
import { EVAL_TYPE_LABEL } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatScore, formatShortDate } from '@/lib/format'
import type { StudentExamResult } from '@/types/studentExam'
import { ReportViewSingleSlide } from '@/components/reports/ReportViewSingleSlide'
import { PAGE_TEXT } from '@/lib/pageText'

// 학생시험상세페이지 (SCR-STU-EXAM-DETAIL)
export default function StudentExamDetailPage() {
  const { slug, studentId, examId } = useParams<{
    slug: string
    studentId: string
    examId: string
  }>()
  const { data: result, loading, error } = useStudentExam(studentId ?? null, examId ?? null)

  const backPath = `/${slug}/students/${studentId}?tab=scores`

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div>
        <PageHeader
          title="시험 상세"
          guide={PAGE_TEXT.STUDENT_EXAM_DETAIL.guide}
          back={{ label: '시험 목록으로', to: backPath }}
        />
        <SectionCard>
          <p className="text-sm text-muted-foreground">
            {error ?? '시험 성적을 찾을 수 없습니다.'}
          </p>
        </SectionCard>
      </div>
    )
  }

  return (
    <ExamResultView
      result={result}
      slug={slug ?? ''}
      studentId={studentId ?? ''}
      examId={examId ?? ''}
      backPath={backPath}
    />
  )
}

interface ExamResultViewProps {
  result: StudentExamResult
  slug: string
  studentId: string
  examId: string
  backPath: string
}

function ExamResultView({ result, slug, studentId, examId, backPath }: ExamResultViewProps) {
  const [reportOpen, setReportOpen] = useState(false)
  const { examInfo, subjects, results, total } = result
  const isGrade = examInfo.evalType === 'grade'
  const isScoreMax = examInfo.evalType === 'score_max'
  const className = examInfo.className ?? '삭제된 반'

  const subjectChips = subjects.map((subject) => ({
    id: subject.subjectId,
    label:
      subject.maxScore !== null ? `${subject.name} ${formatScore(subject.maxScore)}` : subject.name,
  }))
  const gradeChips = [...examInfo.grades]
    .sort((a, b) => a.order - b.order)
    .map((grade) => ({ id: grade.id, label: grade.label }))

  const infoItems = [
    { label: '시험일자', value: formatDate(examInfo.examDate) },
    { label: '응시반', value: className },
    { label: '평가방식', value: EVAL_TYPE_LABEL[examInfo.evalType] },
    { label: '시험과목', value: <ChipList items={subjectChips} />, span: 3 as const },
    ...(isGrade
      ? [{ label: '등급 목록', value: <ChipList items={gradeChips} />, span: 3 as const }]
      : []),
    { label: '내부공유용 메모', value: examInfo.memo ?? '-', span: 3 as const },
  ]

  const scoreText = (index: number) => {
    const row = results[index]
    if (isGrade) return row.gradeLabel ?? '-'
    if (row.score === null) return '-'
    const max = subjects[index].maxScore
    return isScoreMax && max !== null
      ? `${formatScore(row.score)}/${formatScore(max)}`
      : formatScore(row.score)
  }

  const subjectName = (subjectId: string) =>
    subjects.find((s) => s.subjectId === subjectId)?.name ?? '과목'

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${examInfo.examName}(${className})`}
        guide="학생의 시험 성적, 반 평균과 석차, 과목별 통계를 확인하고 선생님 피드백을 바로 수정할 수 있습니다."
        back={{ label: '시험 목록으로', to: backPath }}
      />

      <SectionCard title="시험 정보">
        <InfoGrid items={infoItems} />
      </SectionCard>

      <SectionCard title="시험 결과">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>과목</TableHead>
              <TableHead className="text-right">
                {isGrade ? '등급' : isScoreMax ? '점수/만점' : '점수'}
              </TableHead>
              {!isGrade && <TableHead className="text-right">반평균</TableHead>}
              {!isGrade && <TableHead className="text-right">과목석차</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject, index) => (
              <TableRow key={subject.subjectId}>
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell className="text-right tabular-nums">{scoreText(index)}</TableCell>
                {!isGrade && (
                  <TableCell className="text-right tabular-nums">
                    {formatScore(results[index].classAverage)}
                  </TableCell>
                )}
                {!isGrade && (
                  <TableCell className="text-right tabular-nums">
                    {results[index].subjectRank ?? '-'}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
          {!isGrade && (
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">종합</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {total.score === null
                    ? '-'
                    : isScoreMax && total.maxScoreTotal !== null
                      ? `${formatScore(total.score)}/${formatScore(total.maxScoreTotal)}`
                      : formatScore(total.score)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatScore(total.classAverage)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {total.rank ?? '-'}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </SectionCard>

      <TeacherCommentSection
        examId={examId}
        participantId={result.participantId}
        initial={result.teacherComment}
      />

      {result.subjectComparison && (
        <ScoreCompareChart
          data={result.subjectComparison.map((item) => ({
            subject: subjectName(item.subjectId),
            personal: item.personalScore,
            average: item.examAverage,
          }))}
        />
      )}

      {result.recentTrend && (
        <div className="grid gap-4 md:grid-cols-2">
          {result.recentTrend.map((trend) => (
            <ScoreTrendChart
              key={trend.subjectId}
              title={`${subjectName(trend.subjectId)} 최근 6회 점수`}
              data={trend.history.map((point) => ({
                label: formatShortDate(point.examDate),
                personal: point.score,
              }))}
              series={['personal']}
            />
          ))}
        </div>
      )}

      {result.gradeDistribution && (
        <div className="grid gap-4 md:grid-cols-2">
          {result.gradeDistribution.map((item) => (
            <GradeDistributionChart
              key={item.subjectId}
              title={`${subjectName(item.subjectId)} 등급 분포`}
              data={item.distribution.map((d) => ({ grade: d.label, count: d.count }))}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          시험 정보 및 성적 수정은{' '}
          <Link
            to={`/${slug}/exams/${examId}`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            시험 관리 페이지
          </Link>
          에서 할 수 있습니다.
        </p>
        <Button type="button" onClick={() => setReportOpen(true)}>
          이 시험 리포트 만들기
        </Button>
      </div>
      {reportOpen && (
        <ReportViewSingleSlide
          studentId={studentId}
          examId={examId}
          examName={examInfo.examName}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  )
}

interface TeacherCommentSectionProps {
  examId: string
  participantId: string
  initial: string | null
}

// 선생님 피드백 즉시 수정 (API 24)
function TeacherCommentSection({ examId, participantId, initial }: TeacherCommentSectionProps) {
  const [saved, setSaved] = useState(initial ?? '')
  const [value, setValue] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)

  const dirty = value.trim() !== saved.trim()

  const handleSave = async () => {
    setSaving(true)
    try {
      const comment = value.trim()
      await studentExamApi.updateComment(examId, participantId, comment || null)
      setSaved(comment)
      setValue(comment)
      toast.success('피드백이 저장되었습니다.')
    } catch (e) {
      toast.error(getErrorMessage(e, '피드백을 저장하지 못했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard
      title="선생님 피드백"
      actions={
        <Button type="button" size="sm" onClick={handleSave} disabled={!dirty || saving}>
          저장
        </Button>
      }
    >
      <Textarea
        rows={4}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="이 시험에 대한 피드백을 입력하세요."
        aria-label="선생님 피드백"
      />
    </SectionCard>
  )
}
