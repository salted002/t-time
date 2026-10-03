import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/templates/PageHeader'
import { SectionCard } from '@/components/common/SectionCard'
import { InfoGrid } from '@/components/common/InfoGrid'
import { ChipList } from '@/components/common/ChipList'
import { ExamResultTable } from '@/components/exams/ExamResultTable'
import { ExamCopyModal } from '@/components/exams/ExamCopyModal'
import { ScoreTrendChart } from '@/components/charts/ScoreTrendChart'
import { GradeDistributionChart } from '@/components/charts/GradeDistributionChart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { examApi } from '@/api/examApi'
import { useConfirm } from '@/hooks/useConfirm'
import { useExam } from '@/hooks/useExam'
import { EVAL_TYPE_LABEL } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'
import { formatDate, formatScore, formatShortDate } from '@/lib/format'

// 시험상세페이지 (SCR-EXAM-DETAIL)
export default function ExamDetailPage() {
  const { slug, examId } = useParams<{ slug: string; examId: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { data: exam, loading, error } = useExam(examId ?? null)
  const [deleting, setDeleting] = useState(false)
  const [copyOpen, setCopyOpen] = useState(false)

  const listPath = `/${slug}/exams`

  const handleDelete = async () => {
    if (!exam) return

    const ok = await confirm({
      title: '시험을 삭제할까요?',
      description: '이 시험의 응시 기록과 성적이 모두 삭제되며, 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      tone: 'destructive',
    })
    if (!ok) return

    setDeleting(true)
    try {
      await examApi.remove(exam.id)
      toast.success('시험이 삭제되었습니다.')
      navigate(listPath)
    } catch (e) {
      toast.error(getErrorMessage(e, '시험을 삭제하지 못했습니다.'))
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div>
        <PageHeader
          title="시험 상세"
          guide="시험 정보와 응시자별 성적, 반 통계를 확인하는 화면입니다."
          back={{ label: '시험 목록으로', to: listPath }}
        />
        <SectionCard>
          <p className="text-sm text-muted-foreground">
            {error ?? '시험 정보를 찾을 수 없습니다.'}
          </p>
        </SectionCard>
      </div>
    )
  }

  const subjectChips = exam.subjects.map((subject) => ({
    id: subject.id,
    label:
      subject.maxScore !== null ? `${subject.name} ${formatScore(subject.maxScore)}` : subject.name,
  }))

  const gradeChips = [...exam.grades]
    .sort((a, b) => a.order - b.order)
    .map((grade) => ({ id: grade.id, label: grade.label }))

  const infoItems = [
    { label: '시험일자', value: formatDate(exam.examDate) },
    { label: '응시반', value: exam.className ?? '삭제된 반' },
    { label: '평가방식', value: EVAL_TYPE_LABEL[exam.evalType] },
    { label: '시험과목', value: <ChipList items={subjectChips} />, span: 3 as const },
    ...(exam.evalType === 'grade'
      ? [{ label: '등급 목록', value: <ChipList items={gradeChips} />, span: 3 as const }]
      : []),
    { label: '내부공유용 메모', value: exam.memo ?? '-', span: 3 as const },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${exam.name}(${exam.className ?? '삭제된 반'})`}
        guide="시험 정보와 응시자별 성적, 반 통계를 확인합니다. 성적과 시험 정보는 각 영역의 [수정] 버튼으로 고칩니다."
        back={{ label: '시험 목록으로', to: listPath }}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyOpen(true)}
              disabled={deleting}
            >
              이 시험 복사하기
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              시험 삭제하기
            </Button>
          </>
        }
      />

      <SectionCard
        title="시험 정보"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`${listPath}/${exam.id}/edit`)}
          >
            시험 정보 수정
          </Button>
        }
      >
        <InfoGrid items={infoItems} />
      </SectionCard>

      <SectionCard
        title="시험 결과"
        description={`응시 ${exam.participants.length}명`}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`${listPath}/${exam.id}/results`)}
          >
            성적 수정
          </Button>
        }
      >
        {exam.participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">응시 학생이 없습니다.</p>
        ) : (
          <ExamResultTable exam={exam} />
        )}
      </SectionCard>

      {exam.subjectTrend && (
        <div className="grid gap-4 md:grid-cols-2">
          {exam.subjectTrend.map((trend) => {
            const subject = exam.subjects.find((item) => item.id === trend.subjectId)

            return (
              <ScoreTrendChart
                key={trend.subjectId}
                title={`${subject?.name ?? '과목'} 반평균 추이 (최근 6회)`}
                data={trend.history.map((point) => ({
                  label: formatShortDate(point.examDate),
                  average: point.classAverage,
                }))}
                series={['average']}
              />
            )
          })}
        </div>
      )}

      {exam.gradeDistribution && (
        <div className="grid gap-4 md:grid-cols-2">
          {exam.gradeDistribution.map((item) => {
            const subject = exam.subjects.find((s) => s.id === item.subjectId)

            return (
              <GradeDistributionChart
                key={item.subjectId}
                title={`${subject?.name ?? '과목'} 등급 분포`}
                data={item.distribution.map((d) => ({ grade: d.label, count: d.count }))}
              />
            )
          })}
        </div>
      )}

      {copyOpen && (
        <ExamCopyModal
          exam={exam}
          onClose={() => setCopyOpen(false)}
          onCopied={(newId) => navigate(`${listPath}/${newId}/results`)}
        />
      )}
    </div>
  )
}
